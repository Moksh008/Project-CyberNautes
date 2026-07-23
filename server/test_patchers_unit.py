from unittest.mock import patch
from app.services.manifest_patch_service import (
    _patch_package_json,
    _patch_requirements,
    _patch_go_mod,
    _patch_pom_xml,
)

def mock_resolve_target(osv_name, ecosystem, current_version, cves):
    fixed_versions = {
        "express": ("4.19.2", "osv (cve-matched)"),
        "urllib3": ("1.26.18", "osv (cve-matched)"),
        "github.com/gin-gonic/gin": ("1.9.1", "osv (cve-matched)"),
        "org.apache.logging.log4j:log4j-core": ("2.17.1", "osv (cve-matched)"),
    }
    return fixed_versions.get(osv_name.lower(), (None, ""))

def main():
    with patch("app.services.manifest_patch_service._resolve_target", side_effect=mock_resolve_target):
        print("=== 1. npm (package.json) ===")
        pkg_json = '{\n  "dependencies": {\n    "express": "^4.16.0"\n  }\n}'
        t1, a1 = _patch_package_json(pkg_json, {"express": ["CVE-2024-29041"]})
        print("Applied:", a1)
        print("Patched Text:\n", t1)
        assert len(a1) == 1 and a1[0]["to"] == "^4.19.2"

        print("\n=== 2. PyPI (requirements.txt) ===")
        reqs = "urllib3==1.26.5\nrequests==2.25.1\n"
        t2, a2 = _patch_requirements(reqs, {"urllib3": ["CVE-2023-45803"]})
        print("Applied:", a2)
        print("Patched Text:\n", t2)
        assert len(a2) == 1 and a2[0]["to"] == "urllib3==1.26.18"

        print("\n=== 3. Go (go.mod) ===")
        go_mod = "module example.com/app\n\ngo 1.20\n\nrequire (\n\tgithub.com/gin-gonic/gin v1.7.0\n)\n"
        t3, a3 = _patch_go_mod(go_mod, {"gin": ["CVE-2023-26127"]})
        print("Applied:", a3)
        print("Patched Text:\n", t3)
        assert len(a3) == 1 and a3[0]["to"] == "v1.9.1"

        print("\n=== 4. Maven (pom.xml) ===")
        pom = "<project><dependencies><dependency><groupId>org.apache.logging.log4j</groupId><artifactId>log4j-core</artifactId><version>2.14.1</version></dependency></dependencies></project>"
        t4, a4 = _patch_pom_xml(pom, {"log4j-core": ["CVE-2021-44228"]})
        print("Applied:", a4)
        print("Patched Text:\n", t4)
        assert len(a4) == 1 and a4[0]["to"] == "2.17.1"

    print("\nALL 4 MANIFEST PATCHERS PASSED UNIT TEST VERIFICATION PERFECTLY!")

if __name__ == "__main__":
    main()
