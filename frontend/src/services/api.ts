export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    method,
    headers:
      body instanceof FormData ? {} : { "Content-Type": "application/json" },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => ({ detail: "Không kết nối được máy chủ." }));
    let message = data.detail;
    if (Array.isArray(message))
      message = message.map((e: { msg: string }) => e.msg).join("; ");
    if (typeof message === "object")
      message = `${message.thong_bao || "Yêu cầu không hợp lệ"}${message.thieu ? " " + message.thieu.map((s: { phan_bo: number; can: number; co: number }) => `Phân bổ ${s.phan_bo}: cần ${s.can}, có ${s.co}.`).join(" ") : ""}`;
    throw new Error(message || "Yêu cầu không thành công.");
  }
  return response.json();
}
export const date = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN");
export const labels: Record<string, string> = {
  draft: "Bản nháp",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  retired: "Ngừng dùng",
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
  single: "Một đáp án",
  multiple: "Nhiều đáp án",
  true_false: "Đúng / sai",
};
