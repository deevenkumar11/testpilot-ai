import ipaddress
import socket
from urllib.parse import urlparse
from app.core.config import settings

# Explicitly blocked hostnames
BLOCKED_HOSTNAMES = {
    "localhost",
    "metadata.google.internal",
    "metadata.aws",
    "instance-data",
    "169.254.169.254",
}

# Restricted IP networks
RESTRICTED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),          # Current network (only valid as source)
    ipaddress.ip_network("10.0.0.0/8"),         # RFC 1918 Private
    ipaddress.ip_network("100.64.0.0/10"),      # Shared Address Space (CGNAT)
    ipaddress.ip_network("127.0.0.0/8"),        # Loopback
    ipaddress.ip_network("169.254.0.0/16"),     # Link Local / Cloud Metadata
    ipaddress.ip_network("172.16.0.0/12"),      # RFC 1918 Private
    ipaddress.ip_network("192.0.0.0/24"),       # IETF Protocol Assignments
    ipaddress.ip_network("192.0.2.0/24"),       # TEST-NET-1
    ipaddress.ip_network("192.168.0.0/16"),     # RFC 1918 Private
    ipaddress.ip_network("198.18.0.0/15"),      # Benchmarking
    ipaddress.ip_network("198.51.100.0/24"),    # TEST-NET-2
    ipaddress.ip_network("203.0.113.0/24"),     # TEST-NET-3
    ipaddress.ip_network("224.0.0.0/4"),        # Multicast
    ipaddress.ip_network("240.0.0.0/4"),        # Reserved
    ipaddress.ip_network("255.255.255.255/32"), # Broadcast
    # IPv6 ranges
    ipaddress.ip_network("::1/128"),            # Loopback
    ipaddress.ip_network("::/128"),             # Unspecified
    ipaddress.ip_network("fc00::/7"),           # Unique Local Address (ULA)
    ipaddress.ip_network("fe80::/10"),          # Link-local
    ipaddress.ip_network("ff00::/8"),           # Multicast
]

class SSRFSecurityError(Exception):
    """Raised when a request destination violates SSRF protection policy."""
    def __init__(self, message: str = "Destination address is restricted due to SSRF safety policy"):
        self.message = message
        super().__init__(self.message)

def is_ip_restricted(ip_addr: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """Checks whether an IP is in restricted/private/loopback ranges."""
    if ip_addr.is_loopback or ip_addr.is_private or ip_addr.is_reserved or ip_addr.is_link_local or ip_addr.is_multicast:
        return True
    
    for net in RESTRICTED_NETWORKS:
        if ip_addr in net:
            return True
            
    return False

def validate_url_ssrf(url: str, enforce: bool = True) -> str:
    """
    Validates that a URL does not point to localhost, private networks, or metadata services.
    Validates before connection and resolves DNS to inspect all destination IPs.
    """
    if not enforce or not settings.SSRF_PROTECTION_ENABLED:
        return url

    if not url or not isinstance(url, str):
        raise SSRFSecurityError("Invalid URL provided")

    parsed = urlparse(url.strip())
    
    # 1. Check scheme
    if parsed.scheme.lower() not in ("http", "https"):
        raise SSRFSecurityError(f"Prohibited protocol scheme '{parsed.scheme}'. Only HTTP and HTTPS are permitted.")

    hostname = parsed.hostname
    if not hostname:
        raise SSRFSecurityError("URL must contain a valid hostname or IP address.")

    hostname_lower = hostname.lower()

    # 2. Check explicitly blocked hostnames
    if hostname_lower in BLOCKED_HOSTNAMES:
        raise SSRFSecurityError(f"Access to '{hostname}' is blocked by SSRF protection policy (restricted hostname).")

    # 3. Check if hostname is directly an IP literal
    try:
        ip_obj = ipaddress.ip_address(hostname_lower)
        if is_ip_restricted(ip_obj):
            raise SSRFSecurityError(f"Access to IP '{hostname}' is blocked (private, loopback, or metadata address).")
        return url
    except ValueError:
        # Hostname is a domain name, proceed to DNS resolution check
        pass

    # 4. Resolve DNS and inspect resolved IP addresses
    port = parsed.port or (443 if parsed.scheme.lower() == "https" else 80)
    try:
        addr_info = socket.getaddrinfo(hostname, port, proto=socket.IPPROTO_TCP)
        if not addr_info:
            raise SSRFSecurityError(f"Could not resolve host '{hostname}'.")

        for item in addr_info:
            sockaddr = item[4]
            resolved_ip_str = sockaddr[0]
            try:
                ip_obj = ipaddress.ip_address(resolved_ip_str)
                if is_ip_restricted(ip_obj):
                    raise SSRFSecurityError(
                        f"Resolved address '{resolved_ip_str}' for host '{hostname}' is a restricted network IP."
                    )
            except ValueError:
                raise SSRFSecurityError(f"Unparseable resolved IP address '{resolved_ip_str}'.")
    except socket.gaierror as e:
        raise SSRFSecurityError(f"DNS resolution failure for host '{hostname}': {str(e)}")

    return url
