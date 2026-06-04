"""
全球签证与移民政策智能匹配引擎 - Streamlit 可视化演示版

运行方式：
    streamlit run app.py

说明：
    本应用内置 3 个 Mock 规则，用于演示“国籍与硬性门槛过滤 → 分制与类别匹配 → 可行性分级排序”的完整流程。
    规则并非实时官方政策，请勿直接作为正式申请依据。
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import streamlit as st


# -----------------------------
# 1. 页面基础配置
# -----------------------------
st.set_page_config(
    page_title="全球签证与移民政策智能匹配引擎",
    page_icon="🌏",
    layout="wide",
    initial_sidebar_state="expanded",
)


# -----------------------------
# 2. Mock 规则数据结构
# -----------------------------
@dataclass(frozen=True)
class VisaRule:
    """用于演示的签证规则。

    字段说明：
    - level: A/B/C，对应高可行、需外部条件、高风险。
    - mode: threshold 表示门槛制；points 表示积分制；lottery 表示抽签/配额制。
    - eligible_passports: None 代表不限国籍；否则只允许列表中的护照。
    - min_budget_cny: 估算最低准备资金，单位人民币。
    """

    country: str
    visa_name: str
    level: str
    mode: str
    eligible_passports: list[str] | None
    min_age: int
    max_age: int
    min_education: str
    min_language: str
    min_experience_years: int
    min_budget_cny: int
    target_purposes: list[str]
    description: str
    pain_point: str


# 学历、语言采用有序映射，便于进行“最低底线”比较。
EDUCATION_RANK = {
    "高中/中专": 1,
    "大专": 2,
    "本科": 3,
    "硕士": 4,
    "博士": 5,
}

LANGUAGE_RANK = {
    "无语言成绩": 0,
    "基础沟通": 1,
    "雅思 5.5 / 同等": 2,
    "雅思 6.5 / 同等": 3,
    "雅思 7.0+ / 同等": 4,
    "日语 N2 / 韩语 TOPIK 4+": 3,
}

# 内置 3 个 Mock 国家/路径规则，让用户能够立刻测试通流程。
VISA_RULES = [
    VisaRule(
        country="加拿大",
        visa_name="Express Entry / 联邦技术移民 Mock",
        level="A",
        mode="points",
        eligible_passports=None,
        min_age=18,
        max_age=44,
        min_education="本科",
        min_language="雅思 6.5 / 同等",
        min_experience_years=3,
        min_budget_cny=120_000,
        target_purposes=["长期移民", "找工作"],
        description="适合英语较好、学历和工作年限稳定的技术/专业人才。",
        pain_point="真实项目需对照 CRS 最新邀请分、NOC/TEER 职业匹配、省提名机会与资金证明。",
    ),
    VisaRule(
        country="日本",
        visa_name="高度专业人才签证 Mock",
        level="B",
        mode="points",
        eligible_passports=None,
        min_age=18,
        max_age=59,
        min_education="本科",
        min_language="基础沟通",
        min_experience_years=3,
        min_budget_cny=80_000,
        target_purposes=["找工作", "长期移民", "创业"],
        description="适合高学历、专业经验较强，愿意先获得日本雇主 offer 的申请人。",
        pain_point="通常需要雇主、年收入、学历、履历、研究/管理背景等组合加分；日语能力会显著提升落地成功率。",
    ),
    VisaRule(
        country="澳大利亚",
        visa_name="Working Holiday / 打工度假 Mock",
        level="C",
        mode="lottery",
        eligible_passports=["中国", "日本", "韩国", "新加坡", "马来西亚"],
        min_age=18,
        max_age=30,
        min_education="大专",
        min_language="雅思 5.5 / 同等",
        min_experience_years=0,
        min_budget_cny=35_000,
        target_purposes=["短期体验", "找工作"],
        description="适合年龄较低、预算有限、希望先海外体验或积累本地经历的人群。",
        pain_point="部分护照类别存在名额、抽签或开放时间窗口限制，且不等同于直接移民通道。",
    ),
]


# -----------------------------
# 3. 核心评估函数
# -----------------------------
def rank_value(mapping: dict[str, int], key: str) -> int:
    """安全读取等级值，未知输入默认按最低等级处理。"""

    return mapping.get(key, 0)


def calculate_mock_points(
    *,
    age: int,
    education: str,
    language: str,
    experience_years: int,
    budget_cny: int,
) -> int:
    """模拟积分制签证的粗略打分。

    注意：这是演示用规则，不对应任何国家官方完整计分表。
    """

    # 年龄分：25-34 岁为黄金区间，其次是 18-24 和 35-39。
    if 25 <= age <= 34:
        age_points = 30
    elif 18 <= age <= 24 or 35 <= age <= 39:
        age_points = 20
    elif 40 <= age <= 44:
        age_points = 10
    else:
        age_points = 0

    # 学历分：按学历等级递增。
    education_points = {
        "高中/中专": 0,
        "大专": 10,
        "本科": 20,
        "硕士": 25,
        "博士": 30,
    }.get(education, 0)

    # 语言分：语言越强越有利。
    language_points = {
        "无语言成绩": 0,
        "基础沟通": 5,
        "雅思 5.5 / 同等": 10,
        "雅思 6.5 / 同等": 20,
        "雅思 7.0+ / 同等": 30,
        "日语 N2 / 韩语 TOPIK 4+": 20,
    }.get(language, 0)

    # 工作经验分：3 年以上开始明显加分。
    if experience_years >= 8:
        experience_points = 20
    elif experience_years >= 5:
        experience_points = 15
    elif experience_years >= 3:
        experience_points = 10
    elif experience_years >= 1:
        experience_points = 5
    else:
        experience_points = 0

    # 预算仅做辅助加分，避免把资金作为技术移民的主要判断因素。
    budget_points = 5 if budget_cny >= 150_000 else 0

    return age_points + education_points + language_points + experience_points + budget_points


def evaluate_rule(rule: VisaRule, profile: dict) -> tuple[bool, list[str], int | None]:
    """按照核心匹配逻辑对单条签证规则进行过滤与评估。"""

    reasons: list[str] = []

    # Step 1：国籍与硬性门槛过滤。
    if rule.eligible_passports is not None and profile["passport"] not in rule.eligible_passports:
        reasons.append(f"护照国籍不在该 Mock 规则允许列表：{', '.join(rule.eligible_passports)}")
        return False, reasons, None

    if not (rule.min_age <= profile["age"] <= rule.max_age):
        reasons.append(f"年龄需在 {rule.min_age}-{rule.max_age} 岁之间")
        return False, reasons, None

    if rank_value(EDUCATION_RANK, profile["education"]) < rank_value(EDUCATION_RANK, rule.min_education):
        reasons.append(f"学历最低需达到：{rule.min_education}")
        return False, reasons, None

    if rank_value(LANGUAGE_RANK, profile["language"]) < rank_value(LANGUAGE_RANK, rule.min_language):
        reasons.append(f"语言最低需达到：{rule.min_language}")
        return False, reasons, None

    if profile["experience_years"] < rule.min_experience_years:
        reasons.append(f"工作年限最低需达到：{rule.min_experience_years} 年")
        return False, reasons, None

    if profile["budget_cny"] < rule.min_budget_cny:
        reasons.append(f"预算建议至少准备：¥{rule.min_budget_cny:,}")
        return False, reasons, None

    if profile["purpose"] not in rule.target_purposes:
        reasons.append(f"当前出国目的更适配：{' / '.join(rule.target_purposes)}")
        return False, reasons, None

    # Step 2：门槛制直接纳入候选；积分制计算模拟分。
    mock_points: int | None = None
    if rule.mode == "points":
        mock_points = calculate_mock_points(
            age=profile["age"],
            education=profile["education"],
            language=profile["language"],
            experience_years=profile["experience_years"],
            budget_cny=profile["budget_cny"],
        )
        reasons.append(f"模拟综合分：{mock_points} 分")
    elif rule.mode == "threshold":
        reasons.append("已满足全部 Mock 硬性门槛")
    else:
        reasons.append("满足基础条件，但仍受抽签、配额或开放窗口影响")

    return True, reasons, mock_points


def group_matches(rules: Iterable[VisaRule], profile: dict) -> dict[str, list[dict]]:
    """将匹配结果按 A/B/C 分级归类。"""

    grouped = {"A": [], "B": [], "C": []}

    for rule in rules:
        matched, reasons, mock_points = evaluate_rule(rule, profile)
        if matched:
            grouped[rule.level].append(
                {
                    "rule": rule,
                    "reasons": reasons,
                    "mock_points": mock_points,
                }
            )

    # Step 3：可行性排序。积分高的排前面；同分按规则原始等级展示。
    for level in grouped:
        grouped[level].sort(key=lambda item: item["mock_points"] or 0, reverse=True)

    return grouped


def render_result_card(level: str, item: dict) -> None:
    """根据 A/B/C 等级使用不同 Streamlit 组件展示结果。"""

    rule: VisaRule = item["rule"]
    title = f"{rule.country}｜{rule.visa_name}"
    detail = (
        f"**匹配说明：** {rule.description}\n\n"
        f"**系统判断：** {'；'.join(item['reasons'])}\n\n"
        f"**核心门槛与痛点：** {rule.pain_point}"
    )

    if level == "A":
        st.success(f"🟢 级别 A：{title}\n\n{detail}")
    elif level == "B":
        st.warning(f"🟡 级别 B：{title}\n\n{detail}")
    else:
        st.error(f"🔴 级别 C：{title}\n\n{detail}")


# -----------------------------
# 4. 页面主体与输入表单
# -----------------------------
st.title("🌏 全球签证与移民政策智能匹配引擎")
st.caption("基于国籍、年龄、学历、语言、工作背景、预算、出国目的与随行人员进行 Mock 初筛。")

with st.sidebar:
    st.header("🧾 个人画像输入")

    # 护照国籍：用于做双边协议、配额、WHV 等硬性过滤。
    passport = st.selectbox(
        "护照国籍",
        ["中国", "日本", "韩国", "新加坡", "马来西亚", "美国", "加拿大", "英国", "澳大利亚", "其他"],
        index=0,
    )

    # 年龄：技术移民积分制通常对年龄非常敏感。
    age = st.slider("年龄", min_value=18, max_value=60, value=30, step=1)

    # 学历：用于最低门槛与模拟积分。
    education = st.radio(
        "最高学历",
        list(EDUCATION_RANK.keys()),
        index=2,
        horizontal=False,
    )

    # 语言：为简化演示，统一映射为相对等级。
    language = st.selectbox(
        "语言能力",
        list(LANGUAGE_RANK.keys()),
        index=3,
    )

    # 工作背景：行业与年限共同影响路径建议。
    industry = st.selectbox(
        "工作背景 / 行业",
        ["软件/IT", "工程/制造", "金融/咨询", "医疗/护理", "教育/科研", "设计/创意", "运营/销售", "无全职经验", "其他"],
    )
    experience_years = st.slider("全职工作年限", min_value=0, max_value=25, value=5, step=1)

    # 资产预算：用于资金证明、登陆安家成本和创业/数字游民门槛估算。
    budget_cny = st.number_input(
        "资产预算（人民币）",
        min_value=0,
        max_value=10_000_000,
        value=300_000,
        step=10_000,
        format="%d",
    )

    # 出国目的：决定推荐项目类别。
    purpose = st.selectbox(
        "出国目的",
        ["长期移民", "找工作", "数字游民", "创业", "子女教育", "短期体验"],
        index=0,
    )

    # 随行人员：影响资金证明、配偶加分、子女教育预算。
    family = st.multiselect(
        "随行人员",
        ["无", "配偶", "子女", "父母"],
        default=["无"],
    )

    submitted = st.button("🚀 一键智能匹配", type="primary", use_container_width=True)


# -----------------------------
# 5. 结果展示
# -----------------------------
if submitted:
    profile = {
        "passport": passport,
        "age": age,
        "education": education,
        "language": language,
        "industry": industry,
        "experience_years": experience_years,
        "budget_cny": int(budget_cny),
        "purpose": purpose,
        "family": family,
    }

    st.subheader("🎯 评估综述")
    st.write(
        f"当前画像：**{passport}护照**、**{age}岁**、**{education}**、"
        f"语言为 **{language}**、行业为 **{industry}**、工作 **{experience_years} 年**、"
        f"预算约 **¥{int(budget_cny):,}**、目的为 **{purpose}**、随行人员：**{'、'.join(family)}**。"
    )

    grouped_matches = group_matches(VISA_RULES, profile)
    total_matches = sum(len(items) for items in grouped_matches.values())

    if total_matches == 0:
        st.info("暂未命中内置 Mock 规则。建议提高语言成绩、扩大预算，或切换出国目的后再次测试。")
    else:
        st.subheader("📋 分级匹配结果")

        tab_a, tab_b, tab_c = st.tabs(["🟢 A 高可行", "🟡 B 需条件", "🔴 C 高风险"])

        with tab_a:
            if grouped_matches["A"]:
                for match in grouped_matches["A"]:
                    render_result_card("A", match)
            else:
                st.info("当前未命中 A 级高可行项目。")

        with tab_b:
            if grouped_matches["B"]:
                for match in grouped_matches["B"]:
                    render_result_card("B", match)
            else:
                st.info("当前未命中 B 级曲线路径。")

        with tab_c:
            if grouped_matches["C"]:
                for match in grouped_matches["C"]:
                    render_result_card("C", match)
            else:
                st.info("当前未命中 C 级抽签/配额限制项目。")

    st.subheader("🛠️ 提升建议与行动指南")
    st.markdown(
        """
        - **语言层面**：若目标是英语系技术移民，优先把语言提升到雅思 7.0+ 或同等水平。
        - **职涯层面**：整理近 10 年工作证明、岗位职责、项目成果，并尽量对齐目标国家职业列表。
        - **资金层面**：预留申请费、体检、翻译、公证、登陆安家与 6-12 个月生活成本。
        - **路径层面**：若 A 级项目不足，可考虑先通过留学、雇主担保、省/州提名、境外工签等 Bridge 路径积累本地加分。
        """
    )
else:
    st.info("请在左侧填写个人画像，然后点击 **一键智能匹配** 查看分级结果。")


# -----------------------------
# 6. 页脚免责声明
# -----------------------------
st.divider()
st.caption(
    "免责声明：本工具仅为签证/移民路径初筛与产品原型演示，内置规则为 Mock 数据，"
    "不构成法律、移民顾问或财务建议。正式申请前请以目标国家官方移民局公告、持牌顾问或律师意见为准。"
)
