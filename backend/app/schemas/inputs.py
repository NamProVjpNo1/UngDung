from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class TopicInput(Input):
    ten: str = Field(min_length=1, max_length=200)
    chu_de_id: int | None = None


class QuestionInput(Input):
    chu_de_id: int
    noi_dung: str = Field(min_length=5, max_length=10000)
    loai: Literal["single", "multiple", "true_false"] = "single"
    do_kho: Literal["easy", "medium", "hard"] = "medium"
    lua_chon: list[str] = Field(min_length=2, max_length=8)
    dap_an_dung: list[int] = Field(min_length=1, max_length=8)
    giai_thich: str = Field(default="", max_length=20000)
    doan_tai_lieu_id: int | None = None
    trich_dan: str = Field(default="", max_length=10000)

    @model_validator(mode="after")
    def valid_answers(self):
        self.lua_chon = [x.strip() for x in self.lua_chon]
        if any(not x or len(x) > 3000 for x in self.lua_chon) or len(set(self.lua_chon)) != len(self.lua_chon):
            raise ValueError("Lựa chọn phải có nội dung và không trùng nhau.")
        if len(set(self.dap_an_dung)) != len(self.dap_an_dung) or any(x < 0 or x >= len(self.lua_chon) for x in self.dap_an_dung):
            raise ValueError("Đáp án không hợp lệ.")
        if self.loai != "multiple" and len(self.dap_an_dung) != 1:
            raise ValueError("Câu một lựa chọn chỉ có một đáp án đúng.")
        if self.loai == "true_false" and len(self.lua_chon) != 2:
            raise ValueError("Câu đúng/sai cần hai lựa chọn.")
        return self


class ReviewInput(Input):
    trang_thai: Literal["approved", "rejected", "retired", "draft"]


class Slot(Input):
    chu_de_id: int
    so_luong: int = Field(ge=1, le=100)
    loai: Literal["single", "multiple", "true_false"] | None = None
    do_kho: Literal["easy", "medium", "hard"] | None = None


class BlueprintInput(Input):
    ten: str = Field(min_length=1, max_length=200)
    thoi_gian_phut: int = Field(ge=1, le=240)
    phan_bo: list[Slot] = Field(min_length=1, max_length=30)
    da_xac_minh: bool = False

    @model_validator(mode="after")
    def limit_total(self):
        if sum(x.so_luong for x in self.phan_bo) > 100:
            raise ValueError("Tối đa 100 câu mỗi đề.")
        return self


class GenerateInput(Input):
    mau_de_thi_id: int
    hat_giong: int = Field(default=42, ge=0, le=2147483647)
    cua_so_gan_day: int = Field(default=3, ge=0, le=20)


class AttemptInput(Input):
    de_thi_id: int


class AnswerInput(Input):
    lua_chon: list[int] = Field(max_length=8)
