import { GST_EASY_V3_LOGIN_URL } from "./gst-easy";

export type ProjectBrief = {
  name: string;
  domainTag: string;
  repositoryUrl: string;
  applicationUrl?: string;
  description: string;
};

export const projectBriefs: ProjectBrief[] = [
  {
    name: "GST Easy",
    domainTag: "Tax & GST",
    repositoryUrl: "https://github.com/ramamurthy-540835/Bills_Vouchers",
    applicationUrl: GST_EASY_V3_LOGIN_URL,
    description: "GST Easy V3 is the separate partner GST application for invoice upload, GSTIN verification, ITC reconciliation, filing preparation, onboarding, and reporting. Use synthetic data for testing; select October 2026 for the preloaded demo. Ask whether the client wants investment, a paid pilot, or both. Filing preparation requires accountant review and official schema validation."
  },
  {
    name: "Textile Exports",
    domainTag: "Textile Exports",
    repositoryUrl: "",
    description: "Use the PRISM Textile Exports workspace to record shipment cases, compare destination markets and routes, document origin and customs advice, and submit cases for review. Transshipment alone does not change Indian origin or remove US tariffs."
  },
  {
    name: "Property Auctions",
    domainTag: "Property Auctions",
    repositoryUrl: "",
    description: "Use the PRISM Property Auctions workspace for listings, valuation and seller review, bidder verification, and simulated bids. The discussed 0.25% commission and 1% deposit are indicative, not active terms. Custody, refunds, licensing, and seller authority need approval before a live auction."
  },
  {
    name: "Finance Portal",
    domainTag: "Finance",
    repositoryUrl: "https://github.com/ramamurthy-540835/nelture-gst-income-tax-portal",
    description: "Explore secure customer onboarding, ITR and income documents, property records, valuations, and loan workflow. A loan of roughly 30% of property value was discussed as a potential policy, not an approved lending rule. Require lender approval, privacy, KYC, and regulated lending review."
  },
  {
    name: "Stock Exchange",
    domainTag: "Stock Exchange",
    repositoryUrl: "",
    description: "Use the PRISM Stock Exchange workspace for a manual-price watchlist and paper trades. Live market data, brokerage, order execution, and real-money accounts require licensed providers and applicable regulatory review."
  },
  {
    name: "Industrial IoT",
    domainTag: "Industrial IoT",
    repositoryUrl: "https://github.com/ramamurthy-540835/cement-ai",
    description: "Use cement-ai as the reference for cement plant OT sensor mapping: power, energy, kiln, mills, fans, dust control, and process signals. Identify factory sites, GPS assets, connectivity, integrations, and UTS delivery scope. Live data acquisition and source accuracy require a connected gateway and field validation; the reference repository does not itself prove live device ingestion."
  }
];
