#!/usr/bin/env python3
import base64
import json
import os
import re
import socket
import sys
from urllib.parse import quote, urlparse
from urllib.request import Request, urlopen

SHORTENER_DOMAINS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly",
    "cutt.ly", "shorturl.at", "rb.gy", "rebrand.ly", "tiny.cc"
}
SUSPICIOUS_TLDS = {"zip", "xyz", "top", "click", "work", "party", "gq", "tk", "ml", "cf", "ga", "icu"}
PHISHING_HINTS = re.compile(r"(login|verify|secure|bank|password|account|update|confirm|urgent)", re.IGNORECASE)
URL_REGEX = re.compile(r"(https?://[^\s<>'\"()]+|www\.[^\s<>'\"()]+)", re.IGNORECASE)


def safe_json_request(url: str, method="GET", headers=None, payload=None, timeout=10):
    try:
        req = Request(url, method=method)
        for key, value in (headers or {}).items():
            req.add_header(key, value)
        body = None if payload is None else payload.encode("utf-8")
        with urlopen(req, body, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None


def normalize_url(raw_url: str) -> str:
    url = raw_url.strip().strip(".,;:!?)]}")
    if url.lower().startswith("www."):
        url = f"https://{url}"
    return url


def extract_urls(text: str):
    found = URL_REGEX.findall(text or "")
    urls, seen = [], set()
    for item in found:
        url = normalize_url(item)
        if url not in seen:
            seen.add(url)
            urls.append(url)
    return urls


def get_domain(url: str) -> str:
    try:
        netloc = urlparse(url).netloc.lower()
        if ":" in netloc:
            netloc = netloc.split(":")[0]
        return netloc
    except Exception:
        return ""


def is_ip_host(host: str) -> bool:
    return bool(re.match(r"^\d{1,3}(?:\.\d{1,3}){3}$", host))


def check_google_safe_browsing(url: str):
    key = os.getenv("GOOGLE_SAFE_BROWSING_API_KEY")
    if not key:
        return None
    endpoint = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={key}"
    payload = json.dumps({
        "client": {"clientId": "kavach-url-analyzer", "clientVersion": "1.0.0"},
        "threatInfo": {
            "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url}],
        },
    })
    data = safe_json_request(endpoint, method="POST", headers={"Content-Type": "application/json"}, payload=payload)
    if data is None:
        return None
    return {"threat_found": bool(data.get("matches")), "raw": data}


def check_virustotal(url: str):
    key = os.getenv("VIRUSTOTAL_API_KEY")
    if not key:
        return None
    url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
    endpoint = f"https://www.virustotal.com/api/v3/urls/{url_id}"
    data = safe_json_request(endpoint, headers={"x-apikey": key})
    if not data:
        return None
    stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
    return {
        "malicious": stats.get("malicious", 0),
        "suspicious": stats.get("suspicious", 0),
        "harmless": stats.get("harmless", 0),
        "raw": data,
    }


def check_urlhaus(url: str):
    data = safe_json_request(
        "https://urlhaus-api.abuse.ch/v1/url/",
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        payload=f"url={quote(url)}",
        timeout=8,
    )
    if not data:
        return None
    return {"listed": data.get("query_status") == "ok", "raw": data}


def check_abuseipdb(domain: str):
    key = os.getenv("ABUSEIPDB_API_KEY")
    if not key:
        return None
    try:
        ip = socket.gethostbyname(domain)
    except Exception:
        ip = domain
    endpoint = f"https://api.abuseipdb.com/api/v2/check?ipAddress={quote(ip)}&maxAgeInDays=90"
    data = safe_json_request(endpoint, headers={"Key": key, "Accept": "application/json"})
    if not data:
        return None
    score = data.get("data", {}).get("abuseConfidenceScore", 0)
    return {"abuse_confidence": score, "suspicious": score >= 25, "raw": data}


def check_securitytrails(domain: str):
    key = os.getenv("SECURITYTRAILS_API_KEY")
    if not key:
        return None
    endpoint = f"https://api.securitytrails.com/v1/domain/{domain}"
    data = safe_json_request(endpoint, headers={"APIKEY": key}, timeout=8)
    if not data:
        return None
    alexa_rank = data.get("alexa_rank")
    return {
        "alexa_rank": alexa_rank,
        "suspicious": isinstance(alexa_rank, int) and alexa_rank > 1000000,
        "raw": data,
    }


def heuristics_for_url(url: str):
    flags, score = [], 0
    parsed = urlparse(url)
    domain = get_domain(url)
    tld = domain.split(".")[-1] if "." in domain else ""

    if parsed.scheme.lower() != "https":
        flags.append({"type": "insecure_scheme", "detail": "URL is not HTTPS", "severity": "MEDIUM"})
        score += 12
    if domain in SHORTENER_DOMAINS:
        flags.append({"type": "shortener", "detail": "Known URL shortener domain", "severity": "HIGH"})
        score += 25
    if tld in SUSPICIOUS_TLDS:
        flags.append({"type": "suspicious_tld", "detail": f"Potentially risky TLD .{tld}", "severity": "MEDIUM"})
        score += 16
    if is_ip_host(domain):
        flags.append({"type": "ip_host", "detail": "IP address used as hostname", "severity": "HIGH"})
        score += 30
    if "@" in url:
        flags.append({"type": "at_symbol", "detail": "Contains @ which can hide true destination", "severity": "HIGH"})
        score += 20
    if "xn--" in domain:
        flags.append({"type": "punycode", "detail": "Punycode domain detected", "severity": "HIGH"})
        score += 24
    if PHISHING_HINTS.search(url):
        flags.append({"type": "phishing_keywords", "detail": "Phishing-like keywords found in URL", "severity": "MEDIUM"})
        score += 15

    return {"url": url, "domain": domain, "riskScore": min(score, 100), "flags": flags}


def enrich_with_kavach_checks(item):
    services = {}
    domain = item["domain"]
    url = item["url"]
    score = item["riskScore"]

    gsb = check_google_safe_browsing(url)
    if gsb:
        services["googleSafeBrowsing"] = gsb
        if gsb.get("threat_found"):
            item["flags"].append({"type": "gsb_threat", "detail": "Flagged by Google Safe Browsing", "severity": "HIGH"})
            score += 35

    vt = check_virustotal(url)
    if vt:
        services["virustotal"] = vt
        malicious = int(vt.get("malicious", 0))
        if malicious > 0:
            item["flags"].append({"type": "vt_flagged", "detail": f"Flagged by {malicious} VirusTotal engines", "severity": "HIGH" if malicious >= 3 else "MEDIUM"})
            score += min(malicious * 6, 30)

    uh = check_urlhaus(url)
    if uh:
        services["urlhaus"] = uh
        if uh.get("listed"):
            item["flags"].append({"type": "urlhaus_listed", "detail": "Listed in URLHaus threat database", "severity": "HIGH"})
            score += 30

    abuse = check_abuseipdb(domain)
    if abuse:
        services["abuseipdb"] = abuse
        if abuse.get("suspicious"):
            item["flags"].append({"type": "abuseipdb_suspicious", "detail": f"IP abuse confidence {abuse.get('abuse_confidence', 0)}%", "severity": "MEDIUM"})
            score += min(int(abuse.get("abuse_confidence", 0)) // 5, 20)

    st = check_securitytrails(domain)
    if st:
        services["securitytrails"] = st
        if st.get("suspicious"):
            item["flags"].append({"type": "securitytrails_risk", "detail": "Low-reputation domain from SecurityTrails", "severity": "MEDIUM"})
            score += 12

    item["riskScore"] = min(score, 100)
    if item["riskScore"] >= 60:
        item["verdict"] = "HIGH_RISK"
    elif item["riskScore"] >= 30:
        item["verdict"] = "MEDIUM_RISK"
    else:
        item["verdict"] = "LOW_RISK"
    if services:
        item["kavachThreatIntel"] = services
    return item


def groq_ai_summary(text: str, analyses):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or not analyses:
        return None
    payload = {
        "model": "llama-3.3-70b-versatile",
        "temperature": 0.2,
        "max_tokens": 250,
        "messages": [
            {"role": "system", "content": "You are KAVACH cybersecurity assistant. Summarize URL risk findings in plain, user-friendly language with clear next steps."},
            {"role": "user", "content": json.dumps({"message_excerpt": text[:1000], "url_findings": analyses})},
        ],
    }
    data = safe_json_request(
        "https://api.groq.com/openai/v1/chat/completions",
        method="POST",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        payload=json.dumps(payload),
        timeout=12,
    )
    try:
        return data["choices"][0]["message"]["content"].strip() if data else None
    except Exception:
        return None


def main():
    try:
        body = json.loads(sys.stdin.read() or "{}")
        text = body.get("text", "")
        urls = body.get("urls", []) or extract_urls(text)

        if not urls:
            print(json.dumps({"ok": True, "hasLinks": False, "message": "No links found in input.", "results": [], "overallRiskScore": 0}))
            return

        analyses = [enrich_with_kavach_checks(heuristics_for_url(url)) for url in urls]
        overall = round(sum(a["riskScore"] for a in analyses) / len(analyses))
        ai_summary = groq_ai_summary(text, analyses)

        out = {
            "ok": True,
            "hasLinks": True,
            "results": analyses,
            "overallRiskScore": overall,
            "summary": (
                "High-risk links detected. Avoid opening and verify source."
                if overall >= 55 else
                "Some link risk indicators found. Verify before opening."
                if overall >= 25 else
                "No major link risk indicators detected."
            ),
        }
        if ai_summary:
            out["aiSummary"] = ai_summary
        print(json.dumps(out))
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}))


if __name__ == "__main__":
    main()
