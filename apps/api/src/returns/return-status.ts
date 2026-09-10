import { ReturnStatus } from "@prisma/client";

// REJECTED and COMPLETED are terminal. Marking a return COMPLETED triggers
// an actual Razorpay refund (see ReturnsService.updateStatusAdmin /
// PaymentsService.refundForReturn) - unlike order REFUNDED (see
// order-status.ts), which is still unreachable pending that same wiring.
export const ALLOWED_RETURN_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  [ReturnStatus.REQUESTED]: [ReturnStatus.APPROVED, ReturnStatus.REJECTED],
  [ReturnStatus.APPROVED]: [ReturnStatus.PICKED_UP],
  [ReturnStatus.PICKED_UP]: [ReturnStatus.RECEIVED],
  [ReturnStatus.RECEIVED]: [ReturnStatus.COMPLETED],
  [ReturnStatus.REJECTED]: [],
  [ReturnStatus.COMPLETED]: [],
};

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  [ReturnStatus.REQUESTED]: "requested",
  [ReturnStatus.APPROVED]: "approved",
  [ReturnStatus.REJECTED]: "rejected",
  [ReturnStatus.PICKED_UP]: "picked up",
  [ReturnStatus.RECEIVED]: "received",
  [ReturnStatus.COMPLETED]: "completed",
};
