import pytest
from app.core.security import validate_url_ssrf, SSRFSecurityError

def test_block_localhost():
    with pytest.raises(SSRFSecurityError) as exc_info:
        validate_url_ssrf("http://localhost:8080/secret")
    assert "blocked by SSRF protection policy" in str(exc_info.value)

def test_block_loopback_ip():
    with pytest.raises(SSRFSecurityError) as exc_info:
        validate_url_ssrf("http://127.0.0.1:3000/admin")
    assert "blocked" in str(exc_info.value)

def test_block_cloud_metadata():
    with pytest.raises(SSRFSecurityError) as exc_info:
        validate_url_ssrf("http://169.254.169.254/latest/meta-data/")
    assert "blocked" in str(exc_info.value)

def test_block_rfc1918_private_ips():
    # 10.0.0.1
    with pytest.raises(SSRFSecurityError):
        validate_url_ssrf("http://10.0.0.1/status")
    
    # 192.168.1.1
    with pytest.raises(SSRFSecurityError):
        validate_url_ssrf("https://192.168.1.1:8443/config")
        
    # 172.16.0.1
    with pytest.raises(SSRFSecurityError):
        validate_url_ssrf("http://172.16.0.1:8000/metrics")

def test_block_disallowed_schemes():
    with pytest.raises(SSRFSecurityError) as exc_info:
        validate_url_ssrf("file:///etc/passwd")
    assert "Prohibited protocol scheme" in str(exc_info.value)

    with pytest.raises(SSRFSecurityError) as exc_info:
        validate_url_ssrf("gopher://127.0.0.1:70")
    assert "Prohibited protocol scheme" in str(exc_info.value)
