from sqlalchemy import JSON, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base


class Topic(Base):
    __tablename__ = "chu_de"
    id: Mapped[int] = mapped_column(primary_key=True)
    ten: Mapped[str] = mapped_column(String(200), unique=True)
    chu_de_id: Mapped[int | None] = mapped_column(ForeignKey("chu_de.id"))


class Document(Base):
    __tablename__ = "tai_lieu"
    id: Mapped[int] = mapped_column(primary_key=True)
    ten: Mapped[str] = mapped_column(String(255))
    ma_bam: Mapped[str] = mapped_column(String(64), unique=True)
    duong_dan: Mapped[str] = mapped_column(String(100))
    ngay_tao: Mapped[str] = mapped_column(String(40))


class Chunk(Base):
    __tablename__ = "doan_tai_lieu"
    id: Mapped[int] = mapped_column(primary_key=True)
    tai_lieu_id: Mapped[int] = mapped_column(ForeignKey("tai_lieu.id"), index=True)
    trang: Mapped[int] = mapped_column(Integer)
    noi_dung: Mapped[str] = mapped_column(Text)


class Question(Base):
    __tablename__ = "cau_hoi"
    id: Mapped[int] = mapped_column(primary_key=True)
    chu_de_id: Mapped[int] = mapped_column(ForeignKey("chu_de.id"), index=True)
    trang_thai: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    phien_ban: Mapped[int] = mapped_column(Integer, default=1)


class QuestionVersion(Base):
    __tablename__ = "phien_ban_cau_hoi"
    __table_args__ = (UniqueConstraint("cau_hoi_id", "so_phien_ban"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    cau_hoi_id: Mapped[int] = mapped_column(ForeignKey("cau_hoi.id"), index=True)
    so_phien_ban: Mapped[int] = mapped_column(Integer)
    noi_dung: Mapped[dict] = mapped_column(JSON)
    doan_tai_lieu_id: Mapped[int | None] = mapped_column(ForeignKey("doan_tai_lieu.id"))


class Blueprint(Base):
    __tablename__ = "mau_de_thi"
    id: Mapped[int] = mapped_column(primary_key=True)
    ten: Mapped[str] = mapped_column(String(200))
    thoi_gian_phut: Mapped[int] = mapped_column(Integer)
    phan_bo: Mapped[list] = mapped_column(JSON)
    da_xac_minh: Mapped[bool] = mapped_column(default=False)


class Exam(Base):
    __tablename__ = "de_thi"
    id: Mapped[int] = mapped_column(primary_key=True)
    mau_de_thi_id: Mapped[int] = mapped_column(ForeignKey("mau_de_thi.id"))
    hat_giong: Mapped[int] = mapped_column(Integer)
    noi_dung: Mapped[dict] = mapped_column(JSON)
    ngay_tao: Mapped[str] = mapped_column(String(40))


class Attempt(Base):
    __tablename__ = "lan_lam_bai"
    id: Mapped[int] = mapped_column(primary_key=True)
    de_thi_id: Mapped[int] = mapped_column(ForeignKey("de_thi.id"), index=True)
    bat_dau: Mapped[str] = mapped_column(String(40))
    han_nop: Mapped[str] = mapped_column(String(40))
    da_nop: Mapped[bool] = mapped_column(default=False)
    dap_an: Mapped[dict] = mapped_column(JSON, default=dict)
    ket_qua: Mapped[dict | None] = mapped_column(JSON)


class Review(Base):
    __tablename__ = "lich_on_tap"
    id: Mapped[int] = mapped_column(primary_key=True)
    cau_hoi_id: Mapped[int] = mapped_column(ForeignKey("cau_hoi.id"), unique=True)
    so_lan_dung: Mapped[int] = mapped_column(default=0)
    ngay_den_han: Mapped[str] = mapped_column(String(40))
