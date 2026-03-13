"""study timer methods — descriptions, benefits, pros/cons."""

from typing import List
from schemas.timer import StudyMethod


STUDY_METHODS: List[StudyMethod] = [
    StudyMethod(
        id="pomodoro",
        name="Pomodoro Technique",
        description="The classic time management method using 25-minute focused work sessions followed by 5-minute breaks. After 4 cycles, take a longer 15-30 minute break.",
        focus_time="25 minutes",
        break_time="5 minutes (short), 15-30 minutes (long)",
        benefits=[
            "Simple and easy to follow",
            "Creates urgency with time-boxing",
            "Frequent breaks prevent burnout",
            "Builds discipline through repetition"
        ],
        pros=[
            "Works well for most types of tasks",
            "Short sessions make starting less daunting",
            "Regular breaks maintain mental freshness",
            "Easy to track productivity",
            "Widely adopted and well-documented"
        ],
        cons=[
            "25 minutes may be too short for deep work",
            "Can break flow state during creative tasks",
            "Rigid structure may feel restrictive",
            "Not ideal for tasks requiring long uninterrupted focus"
        ],
        ideal_for=[
            "Studying multiple subjects",
            "Tasks that feel overwhelming",
            "Building study habits",
            "Reviewing and memorization"
        ]
    ),
    
    StudyMethod(
        id="52-17",
        name="52/17 Rule",
        description="Research-backed method suggesting 52 minutes of focused work followed by 17 minutes of complete disconnection. Based on productivity data analysis.",
        focus_time="52 minutes",
        break_time="17 minutes",
        benefits=[
            "Data-driven approach",
            "Longer focus time for deeper work",
            "Substantial break for mental recovery",
            "Matches natural attention spans"
        ],
        pros=[
            "52 minutes allows for deep focus sessions",
            "17-minute break is long enough to truly recharge",
            "Backed by actual productivity research",
            "Fewer interruptions than Pomodoro",
            "Good balance of work and rest"
        ],
        cons=[
            "Longer cycles harder to fit into variable schedules",
            "17-minute breaks can feel too long",
            "May not work well with meetings or classes",
            "Requires more self-discipline for longer sessions"
        ],
        ideal_for=[
            "Deep work and complex problem solving",
            "Writing and creative tasks",
            "Programming and technical work",
            "When you have control over your schedule"
        ]
    ),
    
    StudyMethod(
        id="flowtime",
        name="Flowtime Technique",
        description="A flexible approach where you work until you naturally feel the need for a break, then record your focus time and take a proportional break (typically 1/5 to 1/6 of focus time).",
        focus_time="Variable (until natural break needed)",
        break_time="1/5 to 1/6 of focus time",
        benefits=[
            "Respects natural attention rhythms",
            "Flexible for different energy levels",
            "Builds awareness of personal patterns",
            "Less rigid and more sustainable"
        ],
        pros=[
            "Adapts to your natural focus capacity",
            "No forced interruptions when in flow",
            "Builds self-awareness about productivity",
            "Ideal for creative and knowledge work",
            "Reduces timer anxiety"
        ],
        cons=[
            "Requires self-discipline to actually take breaks",
            "Harder to plan schedules",
            "May lead to overly long sessions without breaks",
            "Not as structured for beginners",
            "Requires tracking to be effective"
        ],
        ideal_for=[
            "Creative work and writing",
            "Experienced students who know their patterns",
            "Variable energy days",
            "Tasks requiring deep concentration"
        ]
    ),
    
    StudyMethod(
        id="ultradian",
        name="Ultradian Rhythm",
        description="Based on the body's natural 90-120 minute cycles. Work for 90 minutes, then take a 20-minute break to align with your biological rhythms.",
        focus_time="90 minutes",
        break_time="20 minutes",
        benefits=[
            "Aligns with natural biological rhythms",
            "90 minutes matches natural alertness cycles",
            "Long sessions for sustained deep work",
            "Scientific backing from sleep research"
        ],
        pros=[
            "Matches body's natural energy cycles",
            "90 minutes perfect for deep work blocks",
            "20-minute break allows for proper recovery",
            "Respects physiological needs",
            "Great for immersive tasks"
        ],
        cons=[
            "90 minutes can feel too long when starting",
            "Requires high stamina and focus",
            "Harder to fit into fragmented schedules",
            "Not suitable for tired or low-energy periods",
            "May be excessive for routine tasks"
        ],
        ideal_for=[
            "Deep research and analysis",
            "Complex problem solving",
            "Writing papers or essays",
            "When you're well-rested and energized"
        ]
    ),
    
    StudyMethod(
        id="anime",
        name="Anime Method",
        description="Work for the length of an anime episode (20-25 minutes), then take a short break. Named for the natural episode length that keeps viewers engaged without fatigue.",
        focus_time="20-24 minutes",
        break_time="5-10 minutes",
        benefits=[
            "Shorter commitment than Pomodoro",
            "Matches entertainment pacing we're used to",
            "Fun and motivating framing",
            "Good for anime fans"
        ],
        pros=[
            "20-24 minutes feels very achievable",
            "Familiar rhythm from watching shows",
            "Less intimidating than 25 minutes",
            "Easy to visualize progress",
            "Fun psychological framing"
        ],
        cons=[
            "Slightly gimmicky",
            "Shorter than ideal for some tasks",
            "May feel less 'professional'",
            "Not based on research"
        ],
        ideal_for=[
            "Building study habits",
            "Low motivation days",
            "Teenagers and young adults",
            "Making studying feel less tedious"
        ]
    ),
    
    StudyMethod(
        id="rule-of-three",
        name="Rule of Three",
        description="Complete 3 focused sessions of any length, then take a substantial break. Focuses on output (sessions completed) rather than time.",
        focus_time="Variable (typically 25-50 minutes each)",
        break_time="Substantial break after 3 sessions",
        benefits=[
            "Focuses on completion, not time",
            "Flexible session length",
            "Builds momentum with session counting",
            "Psychologically rewarding"
        ],
        pros=[
            "Goal-oriented approach",
            "Flexible for different task types",
            "Creates sense of accomplishment",
            "Easy to track daily progress",
            "Combines well with other methods"
        ],
        cons=[
            "Less structured time-wise",
            "Requires self-management of session lengths",
            "May lead to inconsistent session durations",
            "3 sessions might be too few or too many",
            "Not ideal for time-sensitive tasks"
        ],
        ideal_for=[
            "Goal-oriented personalities",
            "Mixed task types in one day",
            "Building consistency",
            "Combining with Pomodoro or 52/17"
        ]
    ),
    
    StudyMethod(
        id="desktime",
        name="DeskTime 52/17",
        description="A variation of 52/17 with strict work-only and break-only zones. During 52 minutes, no distractions at all. During 17 minutes, no work at all.",
        focus_time="52 minutes (strict work only)",
        break_time="17 minutes (strict break only)",
        benefits=[
            "Clear boundaries between work and rest",
            "Eliminates grey zone of partial focus",
            "Builds strong work/rest habits",
            "Prevents work bleeding into breaks"
        ],
        pros=[
            "Sharp separation increases focus quality",
            "Breaks are truly restorative",
            "Reduces guilt about taking breaks",
            "Builds discipline",
            "Prevents burnout more effectively"
        ],
        cons=[
            "Strictness can feel rigid",
            "Hard to maintain in interrupt-driven environments",
            "May cause anxiety about strict rules",
            "Not flexible for urgent matters"
        ],
        ideal_for=[
            "People who struggle with boundaries",
            "Those who feel guilty taking breaks",
            "High-stress study periods",
            "Building strong work habits"
        ]
    ),
    
    StudyMethod(
        id="feynman",
        name="Feynman Sessions",
        description="45-minute focused study sessions followed by 15 minutes of explaining what you learned (to yourself, rubber duck, or notes). Combines focused work with active recall.",
        focus_time="45 minutes",
        break_time="15 minutes (active explanation)",
        benefits=[
            "Combines learning with active recall",
            "Identifies gaps in understanding immediately",
            "Reinforces learning during 'break'",
            "Uses Feynman Technique principles"
        ],
        pros=[
            "Break time is still productive",
            "Immediate reinforcement of learning",
            "Identifies knowledge gaps quickly",
            "Builds teaching/communication skills",
            "No 'wasted' break time"
        ],
        cons=[
            "Breaks are mentally active, not restful",
            "Can be tiring for long study days",
            "Requires preparation for explanation",
            "Not a true mental break",
            "May not suit all personality types"
        ],
        ideal_for=[
            "Exam preparation",
            "Complex conceptual subjects",
            "Building deep understanding",
            "When retention is critical"
        ]
    )
]


def get_study_method(method_id: str) -> StudyMethod | None:
    for method in STUDY_METHODS:
        if method.id == method_id:
            return method
    return None


def get_all_study_methods() -> list[StudyMethod]:
    return STUDY_METHODS
