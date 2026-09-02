export type ApiHealth = {
  status: "ok";
  timestamp: string;
};

export type ProductSummary = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  badge: string;
  rating: number;
  reviewCount: number;
  imageLabel: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  trend: string;
};
