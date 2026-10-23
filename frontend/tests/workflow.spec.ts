import { test, expect } from "@playwright/test";

test("Soạn → duyệt → tạo mẫu đề → tự lưu → tiếp tục → chấm → thống kê", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const unique = `${testInfo.project.name}-${Date.now()}`;
  const navigate = async (label: string) => {
    if (testInfo.project.name === "mobile")
      await page.getByRole("button", { name: "Mở menu", exact: true }).click();
    await page
      .locator(".sidebar")
      .getByRole("button", { name: label, exact: true })
      .click();
  };
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Chào bạn, cùng tiến bộ nhé." }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("dashboard.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await navigate("Ngân hàng câu hỏi");
  await page.getByRole("button", { name: "Thêm chủ đề", exact: true }).click();
  await page.getByLabel("Tên chủ đề").fill(`Chủ đề ${unique}`);
  await page.getByRole("button", { name: "Lưu chủ đề", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Soạn câu hỏi", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Chủ đề", exact: true })
    .selectOption({ label: `Chủ đề ${unique}` });
  await page
    .getByLabel("Nội dung câu hỏi", { exact: true })
    .fill(`Câu hỏi kiểm thử trình duyệt ${unique}?`);
  await page
    .getByLabel("Lựa chọn A", { exact: true })
    .fill("Đúng theo ví dụ kiểm thử");
  await page
    .getByLabel("Lựa chọn B", { exact: true })
    .fill("Sai theo ví dụ kiểm thử");
  await page
    .getByLabel("Lựa chọn C", { exact: true })
    .fill("Lựa chọn bổ sung C");
  await page
    .getByLabel("Lựa chọn D", { exact: true })
    .fill("Lựa chọn bổ sung D");
  await page
    .getByLabel("Giải thích", { exact: true })
    .fill("Đây là dữ liệu kiểm thử, không phải kiến thức thi chính thức.");
  await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const card = page
    .locator(".question-card")
    .filter({ hasText: `Câu hỏi kiểm thử trình duyệt ${unique}?` });
  await expect(card.getByText("Bản nháp", { exact: true })).toBeVisible();
  await card
    .getByRole("button", { name: "Duyệt câu hỏi", exact: true })
    .click();
  await expect(card.getByText("Đã duyệt", { exact: true })).toBeVisible();
  await navigate("Mẫu đề & luyện thi");
  await page.getByRole("button", { name: "Tạo mẫu đề", exact: true }).click();
  await page
    .getByLabel("Tên mẫu đề", { exact: true })
    .fill(`Đề kiểm thử ${unique}`);
  await page
    .getByRole("combobox", { name: "Chủ đề", exact: true })
    .selectOption({ label: `Chủ đề ${unique}` });
  await page.getByLabel("Số câu", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Lưu mẫu đề", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .locator(".blueprint-card")
    .filter({ hasText: `Đề kiểm thử ${unique}` })
    .getByRole("button", { name: "Bắt đầu luyện thi", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: `Câu hỏi kiểm thử trình duyệt ${unique}?`,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Đây là dữ liệu kiểm thử, không phải kiến thức thi chính thức.",
      { exact: true },
    ),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "A Đúng theo ví dụ kiểm thử", exact: true })
    .click();
  await expect(
    page.getByText("Đã lưu trên máy của bạn", { exact: false }),
  ).toBeAttached();
  await page.reload();
  await navigate("Lịch sử luyện thi");
  await page
    .locator("tr")
    .filter({ hasText: `Đề kiểm thử ${unique}` })
    .getByRole("button", { name: "Tiếp tục", exact: false })
    .click();
  await expect(
    page.getByRole("button", {
      name: "A Đúng theo ví dụ kiểm thử",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Nộp bài & xem kết quả", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Kết quả luyện thi", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "1 / 1 câu trả lời đúng", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("result.png"),
    fullPage: true,
  });
  await navigate("Thống kê học tập");
  await expect(
    page.getByText(`Chủ đề ${unique}`, { exact: true }),
  ).toBeVisible();
  await navigate("Cài đặt & sao lưu");
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Tạo & tải bản sao lưu", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.zip$/);
  expect(errors).toEqual([]);
});
