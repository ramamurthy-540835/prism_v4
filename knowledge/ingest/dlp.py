from __future__ import annotations

from dataclasses import dataclass

BLOCKING_TYPES = {"INDIA_AADHAAR_INDIVIDUAL", "INDIA_PAN_INDIVIDUAL", "CREDIT_CARD_NUMBER"}
INFO_TYPES = ["PERSON_NAME", "EMAIL_ADDRESS", "PHONE_NUMBER", "INDIA_AADHAAR_INDIVIDUAL", "INDIA_PAN_INDIVIDUAL", "INDIA_GST_INDIVIDUAL", "CREDIT_CARD_NUMBER", "IBAN_CODE"]


@dataclass(frozen=True)
class DlpResult:
    finding_types: set[str]
    count: int

    def quarantines(self, protection_level: str) -> bool:
        return protection_level in {"public", "internal"} and bool(self.finding_types & BLOCKING_TYPES)


class DlpScanner:
    def __init__(self, project: str):
        from google.cloud import dlp_v2
        self.client = dlp_v2.DlpServiceClient()
        self.parent = f"projects/{project}/locations/global"

    def scan(self, texts: list[str]) -> DlpResult:
        finding_types: set[str] = set()
        count = 0
        for text in texts:
            response = self.client.inspect_content(
                request={"parent": self.parent, "inspect_config": {"info_types": [{"name": t} for t in INFO_TYPES], "min_likelihood": "LIKELY", "include_quote": False}, "item": {"value": text}}
            )
            for finding in response.result.findings:
                finding_types.add(finding.info_type.name)
                count += 1
        return DlpResult(finding_types, count)
