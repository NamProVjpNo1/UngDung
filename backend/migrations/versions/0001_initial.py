"""Schema ban đầu: ngân hàng câu hỏi, đề, lượt làm bài, tài liệu và lịch ôn."""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("chu_de", sa.Column("id", sa.Integer, primary_key=True), sa.Column("ten", sa.String(200), nullable=False, unique=True), sa.Column("chu_de_id", sa.Integer, sa.ForeignKey("chu_de.id")))
    op.create_table(
        "tai_lieu",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("ten", sa.String(255), nullable=False),
        sa.Column("ma_bam", sa.String(64), nullable=False, unique=True),
        sa.Column("duong_dan", sa.String(100), nullable=False),
        sa.Column("ngay_tao", sa.String(40), nullable=False),
    )
    op.create_table(
        "doan_tai_lieu",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("tai_lieu_id", sa.Integer, sa.ForeignKey("tai_lieu.id"), nullable=False),
        sa.Column("trang", sa.Integer, nullable=False),
        sa.Column("noi_dung", sa.Text, nullable=False),
    )
    op.create_index("ix_doan_tai_lieu_tai_lieu_id", "doan_tai_lieu", ["tai_lieu_id"])
    op.create_table(
        "cau_hoi",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("chu_de_id", sa.Integer, sa.ForeignKey("chu_de.id"), nullable=False),
        sa.Column("trang_thai", sa.String(20), nullable=False),
        sa.Column("phien_ban", sa.Integer, nullable=False),
    )
    op.create_index("ix_cau_hoi_chu_de_id", "cau_hoi", ["chu_de_id"])
    op.create_index("ix_cau_hoi_trang_thai", "cau_hoi", ["trang_thai"])
    op.create_table(
        "phien_ban_cau_hoi",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("cau_hoi_id", sa.Integer, sa.ForeignKey("cau_hoi.id"), nullable=False),
        sa.Column("so_phien_ban", sa.Integer, nullable=False),
        sa.Column("noi_dung", sa.JSON, nullable=False),
        sa.Column("doan_tai_lieu_id", sa.Integer, sa.ForeignKey("doan_tai_lieu.id")),
        sa.UniqueConstraint("cau_hoi_id", "so_phien_ban"),
    )
    op.create_index("ix_phien_ban_cau_hoi_cau_hoi_id", "phien_ban_cau_hoi", ["cau_hoi_id"])
    op.create_table(
        "mau_de_thi",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("ten", sa.String(200), nullable=False),
        sa.Column("thoi_gian_phut", sa.Integer, nullable=False),
        sa.Column("phan_bo", sa.JSON, nullable=False),
        sa.Column("da_xac_minh", sa.Boolean, nullable=False),
    )
    op.create_table(
        "de_thi",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("mau_de_thi_id", sa.Integer, sa.ForeignKey("mau_de_thi.id"), nullable=False),
        sa.Column("hat_giong", sa.Integer, nullable=False),
        sa.Column("noi_dung", sa.JSON, nullable=False),
        sa.Column("ngay_tao", sa.String(40), nullable=False),
    )
    op.create_table(
        "lan_lam_bai",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("de_thi_id", sa.Integer, sa.ForeignKey("de_thi.id"), nullable=False),
        sa.Column("bat_dau", sa.String(40), nullable=False),
        sa.Column("han_nop", sa.String(40), nullable=False),
        sa.Column("da_nop", sa.Boolean, nullable=False),
        sa.Column("dap_an", sa.JSON, nullable=False),
        sa.Column("ket_qua", sa.JSON),
    )
    op.create_index("ix_lan_lam_bai_de_thi_id", "lan_lam_bai", ["de_thi_id"])
    op.create_table(
        "lich_on_tap",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("cau_hoi_id", sa.Integer, sa.ForeignKey("cau_hoi.id"), nullable=False, unique=True),
        sa.Column("so_lan_dung", sa.Integer, nullable=False),
        sa.Column("ngay_den_han", sa.String(40), nullable=False),
    )


def downgrade():
    raise RuntimeError("Không hỗ trợ xóa dữ liệu bằng downgrade; hãy phục hồi từ bản sao lưu.")
