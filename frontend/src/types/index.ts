export type Topic = { id: number; ten: string; chu_de_id: number | null };
export type QuestionInput = {
  chu_de_id: number;
  noi_dung: string;
  loai: "single" | "multiple" | "true_false";
  do_kho: "easy" | "medium" | "hard";
  lua_chon: string[];
  dap_an_dung: number[];
  giai_thich: string;
  doan_tai_lieu_id: number | null;
  trich_dan: string;
};
export type Question = QuestionInput & {
  id: number;
  trang_thai: string;
  phien_ban: number;
};
export type Slot = {
  chu_de_id: number;
  so_luong: number;
  loai: string | null;
  do_kho: string | null;
};
export type Blueprint = {
  id: number;
  ten: string;
  thoi_gian_phut: number;
  phan_bo: Slot[];
  da_xac_minh: boolean;
};
export type ExamQuestion = {
  cau_hoi_id: number;
  chu_de_id: number;
  noi_dung: string;
  loai: string;
  do_kho: string;
  lua_chon: string[];
};
export type Exam = {
  id: number;
  ten: string;
  thoi_gian_phut: number;
  cau_hoi: ExamQuestion[];
  da_xac_minh: boolean;
};
export type Attempt = {
  id: number;
  de_thi_id: number;
  bat_dau: string;
  han_nop: string;
  da_nop: boolean;
  dap_an: Record<string, number[]>;
};
export type Result = {
  lan_lam_bai_id: number;
  ten: string;
  diem: number;
  so_dung: number;
  tong_cau: number;
  nop_luc: string;
  thoi_gian_giay: number;
  chi_tiet: (ExamQuestion & {
    dap_an_dung: number[];
    da_chon: number[];
    dung: boolean;
    giai_thich: string;
    trich_dan: string;
  })[];
};
export type AttemptSummary = {
  id: number;
  de_thi_id: number;
  da_nop: boolean;
  ten: string;
  bat_dau: string;
  diem: number | null;
};
export type Overview = {
  cau_hoi: number;
  da_duyet: number;
  tai_lieu: number;
  bai_da_lam: number;
  diem_trung_binh: number;
  xu_huong: { lan_lam_bai_id: number; diem: number; ngay: string }[];
};
export type TopicStat = {
  id: number;
  ten: string;
  so_dung: number;
  tong_cau: number;
};
export type Doc = {
  id: number;
  ten: string;
  ngay_tao: string;
  so_doan: number;
};
export type Chunk = {
  id: number;
  tai_lieu_id: number;
  trang: number;
  noi_dung: string;
};
