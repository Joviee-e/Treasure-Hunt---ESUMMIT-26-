"use strict";

const CLUE_DATABASE = [
  {
    "teamId": "NEO",
    "clues": [
      {
        "clueNumber": 2,
        "code": "KEY1_VH418IZ_2",
        "location": "Lamp Post",
        "clueText": "Every campus has a hunger. Follow the smell of food and the sound of crowds until you find the corridor that feeds them all. Look for the tall sentinel that stands guard — not of iron, not of flesh, but it holds light above the world."
      },
      {
        "clueNumber": 3,
        "code": "KEY1_PJJ1B8RZ_3",
        "location": "Wall named SWAPNIL",
        "clueText": "Something was scrawled here — not by the system, not by an Agent, but by a human who wanted to leave their mark. A wall remembers what people forget. Find the wall that carries a name."
      },
      {
        "clueNumber": 4,
        "code": "KEY1_O7ZR1Q_4",
        "location": "Global Reach Station",
        "clueText": "You have followed the code through alleys, across boundaries, and into buildings. Now the simulation opens up — literally. Find the stretch of open ground where grass grows and the sky is unobstructed. Something has been set up in the field that was not there yesterday."
      },
      {
        "clueNumber": 5,
        "code": "KEY1_UN9YS6_5",
        "location": "Lawn",
        "clueText": "Every signal carries noise. Every message has a sender. You have been chasing code across this campus — but code does not exist without communication. Somewhere on the open ground, a broadcast waits. A station has been set up in the field. Find the signal. Find the booth. Find Global Reach."
      },
      {
        "clueNumber": 6,
        "code": "KEY1_1KK9FU_6",
        "location": "Seats",
        "clueText": "Water flows, light plays, and flags stand tall in the wind. Find the meeting place at the heart of the campus where the fountain speaks and stone seats wait in silence around it."
      },
      {
        "clueNumber": 7,
        "code": "KEY1_49GFRN_7",
        "location": "BOYS ENTRANCE",
        "clueText": "You are almost free. One final threshold remains — the entrance that belongs to one half of this campus. Not the ramp, not the lift. Find where feet have climbed for years, worn smooth by a thousand soles. The final checkpoint waits at the base of what rises."
      }
    ]
  },
  {
    "teamId": "TRINITY",
    "clues": [
      {
        "clueNumber": 2,
        "code": "KEY1_EBUOFY8_2",
        "location": "Security Cabin",
        "clueText": "Behind the campus lies a gate that few use. Not the main face of the institution but its forgotten back. Someone sits here, always watching, always present. Find where the guardian rests."
      },
      {
        "clueNumber": 3,
        "code": "KEY1_ZRBBF6S_3",
        "location": "Generator",
        "clueText": "Somewhere on this campus an engine breathes without moving — it powers things in the dark, waiting for when the real power fails. Find the hum in the alley."
      },
      {
        "clueNumber": 4,
        "code": "KEY1_T6S6TH_4",
        "location": "Global Reach Station",
        "clueText": "Between buildings lies a breath of nature — an open expanse where sport once played and feet once ran. The campus holds this green space with care. Go to where the ground is soft and the sky is wide, and find what has arrived there recently."
      },
      {
        "clueNumber": 5,
        "code": "KEY1_MN3ZSOC0_5",
        "location": "Lawn",
        "clueText": "Every signal carries noise. Every message has a sender. You have been chasing code across this campus — but code does not exist without communication. Somewhere on the open ground, a broadcast waits. A station has been set up in the field. Find the signal. Find the booth. Find Global Reach."
      },
      {
        "clueNumber": 6,
        "code": "KEY1_HQVEGKDO_6",
        "location": "Flag Pole",
        "clueText": "Flags tell stories of allegiance. Find the tall stake of loyalty that rises near still water and arrange yourselves in its shadow."
      },
      {
        "clueNumber": 7,
        "code": "KEY1_K2HTAE_7",
        "location": "BOYS ENTRANCE",
        "clueText": "The simulation ends where arrivals begin. Not where girls enter, not where machines park — where the other half of this campus first crosses the threshold. Find the elevated path that greets them gently."
      }
    ]
  },
  {
    "teamId": "MORPHEUS",
    "clues": [
      {
        "clueNumber": 2,
        "code": "KEY1_XEMY1H6_2",
        "location": "Trees",
        "clueText": "Living things grow here, yet they are not cultivated — they simply exist, wild and rooted, at the edge of a place once meant for children. Find the trees where Balbhavan breathes."
      },
      {
        "clueNumber": 3,
        "code": "KEY1_ALJPL4_3",
        "location": "Generator",
        "clueText": "The campus breathes through pipes and hums through wires. In the alley that feeds hunger, find the metal body that never moves but keeps everything running when the light dies."
      },
      {
        "clueNumber": 4,
        "code": "KEY1_LXI0D2T_4",
        "location": "Global Reach Station",
        "clueText": "Every matrix has a clearing — a place where the code thins and the real bleeds through. On this campus, that place is the open field where the grass grows and the horizon is unbroken. Head there. Something is waiting."
      },
      {
        "clueNumber": 5,
        "code": "KEY1_779PC4RC_5",
        "location": "Lawn",
        "clueText": "Every signal carries noise. Every message has a sender. You have been chasing code across this campus — but code does not exist without communication. Somewhere on the open ground, a broadcast waits. A station has been set up in the field. Find the signal. Find the booth. Find Global Reach."
      },
      {
        "clueNumber": 6,
        "code": "KEY1_A7BRRHL_6",
        "location": "Stairs",
        "clueText": "Stone steps descend near water and light. The fountain knows the way — but look for where feet go down, not up, near where the water plays."
      },
      {
        "clueNumber": 7,
        "code": "KEY1_GQRPPZ_7",
        "location": "BOYS ENTRANCE",
        "clueText": "You have navigated the simulation. One entrance remains — not for vehicles, not for ceremony. It belongs to the other half. Find where they gather on seats at the final threshold, and your checkpoint awaits."
      }
    ]
  },
  {
    "teamId": "ORACLE",
    "clues": [
      {
        "clueNumber": 2,
        "code": "KEY1_O4MFKL_2",
        "location": "Chairs",
        "clueText": "At the campus boundary where few tread, something watches and something waits. Chairs line a small shelter — not for learning, not for eating, but for the patient guardians of the gate."
      },
      {
        "clueNumber": 3,
        "code": "KEY1_OEICNS1V_3",
        "location": "Pipe",
        "clueText": "Something runs beneath or beside structures to channel what would otherwise overflow. In the alley of hunger, a pipe carries burden invisibly. Find it."
      },
      {
        "clueNumber": 4,
        "code": "KEY1_LPCL5MVV_4",
        "location": "Global Reach Station",
        "clueText": "The Oracle said: seek the open space. Not a foyer, not an alley — the place where the campus breathes. Where children once played or athletes once competed on grass. A visitor has arrived there. Find the booth in the field."
      },
      {
        "clueNumber": 5,
        "code": "KEY1_X49EE2_5",
        "location": "Lawn",
        "clueText": "Every signal carries noise. Every message has a sender. You have been chasing code across this campus — but code does not exist without communication. Somewhere on the open ground, a broadcast waits. A station has been set up in the field. Find the signal. Find the booth. Find Global Reach."
      },
      {
        "clueNumber": 6,
        "code": "KEY1_OT7IT9HS_6",
        "location": "Table",
        "clueText": "Where the entry is feminine and the architecture welcomes, a table stands — a flat surface that has seen a thousand things placed upon it. Find it near the entrance made for them."
      },
      {
        "clueNumber": 7,
        "code": "KEY1_ELFYVZO4_7",
        "location": "BOYS ENTRANCE",
        "clueText": "Cross now to where the other half begins. Not the ramp, not the chair — find the vertical pathway that was built for those who cannot climb. The lift area at the final entrance holds your destiny."
      }
    ]
  },
  {
    "teamId": "AGENT SMITH",
    "clues": [
      {
        "clueNumber": 2,
        "code": "KEY1_XHP7PZZ_2",
        "location": "Wall named SWAPNIL",
        "clueText": "The campus breathes life in the alley of hunger. But look for where a name was painted — not a sign, not a notice, but a declaration left in paint by someone who needed the world to know."
      },
      {
        "clueNumber": 3,
        "code": "KEY1_PAFGTR64_3",
        "location": "Road Roller",
        "clueText": "Something enormous and yellow once shaped the earth here. It no longer moves — it rests where the grass grows, a relic of construction sleeping in the open. Find the great machine at rest."
      },
      {
        "clueNumber": 4,
        "code": "KEY1_1SWB8L5_4",
        "location": "Global Reach Station",
        "clueText": "The system is everywhere — and today, the system has placed something in the open. Not inside any building, not in any corridor. Out in the grass, under the sky, a station has been erected for all who pass through. Find it on the lawn."
      },
      {
        "clueNumber": 5,
        "code": "KEY1_S0U1UG_5",
        "location": "Lawn",
        "clueText": "Every signal carries noise. Every message has a sender. You have been chasing code across this campus — but code does not exist without communication. Somewhere on the open ground, a broadcast waits. A station has been set up in the field. Find the signal. Find the booth. Find Global Reach."
      },
      {
        "clueNumber": 6,
        "code": "KEY1_VKZYSHMB_6",
        "location": "Stairs",
        "clueText": "At the entrance reserved for one gender, find the ascending path made of stone — not a ramp, not a lift, but the structure of steps that rises to greet the ones who climb."
      },
      {
        "clueNumber": 7,
        "code": "KEY1_JYDEO11_7",
        "location": "BOYS ENTRANCE",
        "clueText": "You have almost exited the simulation. Find the entrance that completes the symmetry — the one that mirrors what you just left, on the other side of campus. Go to where boys first arrive and find the elevated passage of welcome."
      }
    ]
  },
  {
    "teamId": "NIOBE",
    "clues": [
      {
        "clueNumber": 2,
        "code": "KEY1_GJTCKEV_2",
        "location": "Front Gate Cabin",
        "clueText": "The front face of the institution has a small shelter — not a building, not a booth. A guardian sits within, watching all who enter and exit. Find the cabin at the very face of the campus."
      },
      {
        "clueNumber": 3,
        "code": "KEY1_QP8KWL_3",
        "location": "Ramp Entrance",
        "clueText": "The building bearing a commercial name greets visitors with an angled path. Not a stair, not a lift — a slope that rises gently to meet the door. Go to where Formix begins."
      },
      {
        "clueNumber": 4,
        "code": "KEY1_4L7BWMQ_4",
        "location": "Global Reach Station",
        "clueText": "Navigation brought you this far. Now the simulation gives you open sky. The lawn — that expanse of green that most walk past without thinking — holds something new today. A presence has arrived. Seek it in the open field."
      },
      {
        "clueNumber": 5,
        "code": "KEY1_TTTEYUM_5",
        "location": "Lawn",
        "clueText": "Every signal carries noise. Every message has a sender. You have been chasing code across this campus — but code does not exist without communication. Somewhere on the open ground, a broadcast waits. A station has been set up in the field. Find the signal. Find the booth. Find Global Reach."
      },
      {
        "clueNumber": 6,
        "code": "KEY1_98KWC4BR_6",
        "location": "Ramp",
        "clueText": "Near the entrance made for one half of this campus, a flat elevated path of welcome slopes down gently. It was made for those who cannot take the stairs. Find the ramp at the feminine entrance."
      },
      {
        "clueNumber": 7,
        "code": "KEY1_DNJG89A_7",
        "location": "BOYS ENTRANCE",
        "clueText": "The final threshold is near. Cross to the other entrance — the masculine mirror of where you stood. Find the lift zone, the vertical passage for those who cannot climb. The checkpoint stands beside it."
      }
    ]
  },
  {
    "teamId": "SWITCH",
    "clues": [
      {
        "clueNumber": 2,
        "code": "KEY1_U234UZ3_2",
        "location": "Rabbit Cage",
        "clueText": "Life in a box — small ears, small eyes, small heartbeat. In the open lawn, something lives and is cared for, contained behind wire in the grass. Find the dwelling of the small creature."
      },
      {
        "clueNumber": 3,
        "code": "KEY1_0CS921N_3",
        "location": "Security Cabin",
        "clueText": "Where the campus ends and the outside begins at the rear, a cabin stands — not the front face, not the main gate. Find the shelter at the back boundary where a guardian sits."
      },
      {
        "clueNumber": 4,
        "code": "KEY1_OG1XOK_4",
        "location": "Global Reach Station",
        "clueText": "You are being watched. The agents know where you have been. But the signal you seek now is not a clue hidden under a step or behind a wall — it is in the open, on the grass, where anyone can find it if they know to look. Go to the lawn."
      },
      {
        "clueNumber": 5,
        "code": "KEY1_LQUMLL_5",
        "location": "Lawn",
        "clueText": "Every signal carries noise. Every message has a sender. You have been chasing code across this campus — but code does not exist without communication. Somewhere on the open ground, a broadcast waits. A station has been set up in the field. Find the signal. Find the booth. Find Global Reach."
      },
      {
        "clueNumber": 6,
        "code": "KEY1_XJ499J_6",
        "location": "Stairs",
        "clueText": "Not the ramp, not the lift — at the entrance built for them, find the structure of rising stone. Steps that have carried a thousand footfalls at the girls' gate."
      },
      {
        "clueNumber": 7,
        "code": "KEY1_Q2VXJZG_7",
        "location": "BOYS ENTRANCE",
        "clueText": "One final crossing. The entrance on the other side — where the other half of campus first sets foot. A staircase rises there, worn and familiar. Your checkpoint waits at its base."
      }
    ]
  },
  {
    "teamId": "APOC",
    "clues": [
      {
        "clueNumber": 2,
        "code": "KEY1_JNI2T3W7_2",
        "location": "Fish Tank",
        "clueText": "At the campus boundary you rarely visit — the rear exit — something aquatic lives in glass. Not a natural body of water, but a contained world behind the gate. Find it."
      },
      {
        "clueNumber": 3,
        "code": "KEY1_Z6MYW2_3",
        "location": "Stationary",
        "clueText": "Where tools are sold and supplies are stacked — not a shop, not a class — a place in the foyer of technology where the small necessities of study are kept. Find the stationery in the foyer."
      },
      {
        "clueNumber": 4,
        "code": "KEY1_28AKMV_4",
        "location": "Global Reach Station",
        "clueText": "Beyond the canteen, beyond the buildings — where the ground opens and the air moves freely — something has been placed in the field. Not a machine, not a monument. A booth. A broadcast. A challenge. The lawn holds your next instruction."
      },
      {
        "clueNumber": 5,
        "code": "KEY1_4J5VFX_5",
        "location": "Lawn",
        "clueText": "Every signal carries noise. Every message has a sender. You have been chasing code across this campus — but code does not exist without communication. Somewhere on the open ground, a broadcast waits. A station has been set up in the field. Find the signal. Find the booth. Find Global Reach."
      },
      {
        "clueNumber": 6,
        "code": "KEY1_E27JDD2_6",
        "location": "Seat",
        "clueText": "At the feminine gate, find the elevated resting place — a seat that sits above ground level, built into the architecture of the entrance. The place where one pauses before entering."
      },
      {
        "clueNumber": 7,
        "code": "KEY1_APDCQ8K_7",
        "location": "BOYS ENTRANCE",
        "clueText": "Now cross to the entrance that completes the pair. The boys' gate holds your final answer — not in the lift, not on the ramp. Find where the seats gather at the final threshold. Your checkpoint is among them."
      }
    ]
  },
  {
    "teamId": "DOZER",
    "clues": [
      {
        "clueNumber": 2,
        "code": "KEY1_DY249O_2",
        "location": "Generator",
        "clueText": "In the alley of food and noise, something powers what would otherwise go dark. A mechanical breath-holder, metal-bodied, fuels the electricity of hunger. Find the hum."
      },
      {
        "clueNumber": 3,
        "code": "KEY1_LU4Z9Z_3",
        "location": "Trees",
        "clueText": "A campus is more than buildings — trees stand at its edges too. Somewhere between childhood memory and academic present, a garden for children holds trees that have grown old watching over play. Find the trees of Balbhavan."
      },
      {
        "clueNumber": 4,
        "code": "KEY1_300FKB56_4",
        "location": "Global Reach Station",
        "clueText": "Leave the foyer behind. Exit the building and find the space between structures where the grass grows unchecked. The campus lawn — an open clearing between the concrete world — holds a station that appeared this morning. Find it."
      },
      {
        "clueNumber": 5,
        "code": "KEY1_JJ2CTP37_5",
        "location": "Lawn",
        "clueText": "Every signal carries noise. Every message has a sender. You have been chasing code across this campus — but code does not exist without communication. Somewhere on the open ground, a broadcast waits. A station has been set up in the field. Find the signal. Find the booth. Find Global Reach."
      },
      {
        "clueNumber": 6,
        "code": "KEY1_3G9SNC_6",
        "location": "Table",
        "clueText": "At the entrance fashioned for them, there is neither ramp nor stairs at this spot — just a flat surface that holds what is placed upon it. A table, patient and still, at the feminine gate."
      },
      {
        "clueNumber": 7,
        "code": "KEY1_8TBSWB_7",
        "location": "BOYS ENTRANCE",
        "clueText": "Mirror the entrance you just left — cross to where the other half of campus begins. Not the chair, not the ramp. Find where the staircase rises at the boys' gate and let it carry you to your final destination."
      }
    ]
  },
  {
    "teamId": "TANK",
    "clues": [
      {
        "clueNumber": 2,
        "code": "KEY1_UI54OXI_2",
        "location": "Fish Tank",
        "clueText": "Walk toward the back of campus — past the lawns and the buildings — until you reach a boundary. A tank of water holds a world in miniature. Find what lives behind glass at the rear gate."
      },
      {
        "clueNumber": 3,
        "code": "KEY1_X2JEXNQ_3",
        "location": "Trees",
        "clueText": "In the lot where vehicles rest in rows, something organic grows despite the concrete. Trees stand between machines, indifferent to the metal around them. Find the living among the parked."
      },
      {
        "clueNumber": 4,
        "code": "KEY1_9C9V5WM_4",
        "location": "Global Reach Station",
        "clueText": "The simulation compresses. The buildings crowd. But somewhere between them lies open ground — unroofed, unenclosed, breathing. Go to the lawn of this campus. A station has been established there. They are waiting for you."
      },
      {
        "clueNumber": 5,
        "code": "KEY1_95OUMSX_5",
        "location": "Lawn",
        "clueText": "Every signal carries noise. Every message has a sender. You have been chasing code across this campus — but code does not exist without communication. Somewhere on the open ground, a broadcast waits. A station has been set up in the field. Find the signal. Find the booth. Find Global Reach."
      },
      {
        "clueNumber": 6,
        "code": "KEY1_8LLNH8M_6",
        "location": "Ramp",
        "clueText": "At the entrance reserved for half the campus, a gentle incline greets those who cannot take the stairs. The ramp at the girls' gate — a path of welcome and access. Find it."
      },
      {
        "clueNumber": 7,
        "code": "KEY1_YG0F8R_7",
        "location": "BOYS ENTRANCE",
        "clueText": "The final gate awaits. Boys enter here — and at this entrance, where the ramp greets newcomers gently, your checkpoint stands ready. Climb no stairs. Take no lift. Find the slope."
      }
    ]
  },
  {
    "teamId": "SERAPH",
    "clues": [
      {
        "clueNumber": 2,
        "code": "KEY1_OUCPZTA9_2",
        "location": "Stationary",
        "clueText": "In the foyer of engineering and applied knowledge, supplies for the mind are arranged in neat rows — not for eating, not for building, but for writing, drawing, and noting. Find the stationery."
      },
      {
        "clueNumber": 3,
        "code": "KEY1_J7NKU4_3",
        "location": "Trees",
        "clueText": "Where the parking gives way to natural growth, trees hold their ground among the machines. Not inside any building — outside, among the parked rows. Find what grows in the parking lot."
      },
      {
        "clueNumber": 4,
        "code": "KEY1_08DG4VYW_4",
        "location": "Global Reach Station",
        "clueText": "All signals eventually need open air. The campus has such a place — a green expanse that most cross without pausing. Today you must pause. A booth stands in the field, erected by those who specialise in reaching further. Find it on the lawn."
      },
      {
        "clueNumber": 5,
        "code": "KEY1_EFXL9J_5",
        "location": "Lawn",
        "clueText": "Every signal carries noise. Every message has a sender. You have been chasing code across this campus — but code does not exist without communication. Somewhere on the open ground, a broadcast waits. A station has been set up in the field. Find the signal. Find the booth. Find Global Reach."
      },
      {
        "clueNumber": 6,
        "code": "KEY1_HE0UG2BG_6",
        "location": "Seat",
        "clueText": "Where the feminine entrance presents its options, choose neither the ramp nor the stairs — find the place a person sits. A seat built into the entrance, waiting for the patient."
      },
      {
        "clueNumber": 7,
        "code": "KEY1_8TSGY6_7",
        "location": "BOYS ENTRANCE",
        "clueText": "The final act plays out at the masculine counterpart to where you have been. At the boys' entrance, find not the ramp, not the steps — but the area where the vertical machine waits. Your checkpoint stands in the lift zone."
      }
    ]
  },
  {
    "teamId": "MEROVINGIAN",
    "clues": [
      {
        "clueNumber": 2,
        "code": "KEY1_IK9FOR_2",
        "location": "Lamp Post",
        "clueText": "In the alley where the campus feeds itself, a tall structure stands sentinel — not metal, not human, but a post planted in the ground that holds a globe of light above the world. Find the lamp."
      },
      {
        "clueNumber": 3,
        "code": "KEY1_QQUTF1_3",
        "location": "Red Pipe",
        "clueText": "Something red and cylindrical runs along the ground in the lot of parked machines — a pipe carrying pressure or perhaps just standing guard. Find the red conduit among the vehicles."
      },
      {
        "clueNumber": 4,
        "code": "KEY1_40KWLT_4",
        "location": "Global Reach Station",
        "clueText": "Power travels in many forms. Today it travels through open air on the campus lawn. Leave the buildings — their ducts, their lifts, their foyers — and step outside onto the grass. A station awaits on the open ground. Find it."
      },
      {
        "clueNumber": 5,
        "code": "KEY1_P6QQ6G5M_5",
        "location": "Lawn",
        "clueText": "Every signal carries noise. Every message has a sender. You have been chasing code across this campus — but code does not exist without communication. Somewhere on the open ground, a broadcast waits. A station has been set up in the field. Find the signal. Find the booth. Find Global Reach."
      },
      {
        "clueNumber": 6,
        "code": "KEY1_H8ULBIJ_6",
        "location": "Lift Area",
        "clueText": "At the entrance for the feminine half of this campus, find the elevated crossing — not stairs to climb, but a lift zone for those who wish to ascend without effort. Find the lift area at the girls' entrance."
      },
      {
        "clueNumber": 7,
        "code": "KEY1_L2CYH1ZY_7",
        "location": "BOYS ENTRANCE",
        "clueText": "Cross to the final entrance. At the boys' gate, find the structure of stone — the stairs that have borne the weight of arrivals and departures for years. Your final checkpoint waits at the base of the climb."
      }
    ]
  },
  {
    "teamId": "GHOST",
    "clues": [
      {
        "clueNumber": 2,
        "code": "KEY1_68Z4FI5_2",
        "location": "Volleyball Net",
        "clueText": "Go to where the net divides air from air in the open green. Not a tennis court, not a football pitch — but a net in the grass designed for a ball that must not fall. Find the volleyball net in the lawn."
      },
      {
        "clueNumber": 3,
        "code": "KEY1_M24UUH_3",
        "location": "Chairs",
        "clueText": "The campus has a rear boundary. At this boundary, chairs have been placed — not for students, not for faculty, but for those whose job is to watch and wait. Find the chairs at the back gate."
      },
      {
        "clueNumber": 4,
        "code": "KEY1_VGMVP6_4",
        "location": "Global Reach Station",
        "clueText": "Between the entrance you came from and the buildings ahead lies a stretch of open ground. The lawn — green, wide, unhidden — holds something today that was not there before. A broadcaster has come to campus. Find them."
      },
      {
        "clueNumber": 5,
        "code": "KEY1_CYKQVTOR_5",
        "location": "Lawn",
        "clueText": "Every signal carries noise. Every message has a sender. You have been chasing code across this campus — but code does not exist without communication. Somewhere on the open ground, a broadcast waits. A station has been set up in the field. Find the signal. Find the booth. Find Global Reach."
      },
      {
        "clueNumber": 6,
        "code": "KEY1_KSSVU6_6",
        "location": "Flag Pole",
        "clueText": "Near the fountain, not among the seats, not at the stairs — but at the vertical marker of belonging. Find the pole from which a flag flies near the water."
      },
      {
        "clueNumber": 7,
        "code": "KEY1_P193Z5L_7",
        "location": "BOYS ENTRANCE",
        "clueText": "One entrance over. The masculine gate — where arrivals begin for the other half. Find not the ramp, not the lift zone — but the gathered seats where those who wait, wait. Your checkpoint is among them."
      }
    ]
  },
  {
    "teamId": "LOCK",
    "clues": [
      {
        "clueNumber": 2,
        "code": "KEY1_0JQSB5ZM_2",
        "location": "Pipe",
        "clueText": "In the alley of food and human noise, find the underground or ground-level carrier — a pipe that moves what must be moved, silently and without ceremony. Find the pipe."
      },
      {
        "clueNumber": 3,
        "code": "KEY1_Y94VT9N_3",
        "location": "Shed",
        "clueText": "The workshop holds raw material. Not in the main body — but in its shadow, in the smaller structure that stores overflow and excess. Go to the shed behind the workshop."
      },
      {
        "clueNumber": 4,
        "code": "KEY1_17CETORU_4",
        "location": "Global Reach Station",
        "clueText": "From the alleys and the gates and the pipes — all roads lead eventually to open ground. The lawn of this campus is the clearing in the simulation. Step outside. Step onto the grass. A station stands there, and it has something for you."
      },
      {
        "clueNumber": 5,
        "code": "KEY1_JDKVU80_5",
        "location": "Lawn",
        "clueText": "Every signal carries noise. Every message has a sender. You have been chasing code across this campus — but code does not exist without communication. Somewhere on the open ground, a broadcast waits. A station has been set up in the field. Find the signal. Find the booth. Find Global Reach."
      },
      {
        "clueNumber": 6,
        "code": "KEY1_HVO6VD8F_6",
        "location": "Ramp",
        "clueText": "Back toward the entrance. The feminine gate is behind you now. Cross to its counterpart — where boys arrive — and find the gentle slope that welcomes them without stairs."
      },
      {
        "clueNumber": 7,
        "code": "KEY1_OF1YMQ_7",
        "location": "BOYS ENTRANCE",
        "clueText": "You stand at the ramp. The staircase calls — a few steps away, the stone ascent at the boys' entrance holds the final answer. Your checkpoint lies at the base of the climb. Go."
      }
    ]
  },
  {
    "teamId": "LINK",
    "clues": [
      {
        "clueNumber": 2,
        "code": "KEY1_FEW0LTWC_2",
        "location": "Lamp Post",
        "clueText": "A sentinel of light towers over the alley of food. Not a building, not a sign — a post with a lantern at its crown, standing in the canteen passage. Find the lamp post."
      },
      {
        "clueNumber": 3,
        "code": "KEY1_A86ZSR_3",
        "location": "Security Cabin",
        "clueText": "Behind the campus where few tread, a cabin keeps watch. Not the main entrance guardian — the one at the back. Find the security shelter at the rear boundary."
      },
      {
        "clueNumber": 4,
        "code": "KEY1_Y8WZ1B_4",
        "location": "Global Reach Station",
        "clueText": "You have traced the signal from post to cabin to pipe. Now the signal itself has taken physical form — a booth erected in the open, on the campus green, in the space where the sky meets the ground. Go to the lawn. Find the booth."
      },
      {
        "clueNumber": 5,
        "code": "KEY1_YK71OIYU_5",
        "location": "Lawn",
        "clueText": "Every signal carries noise. Every message has a sender. You have been chasing code across this campus — but code does not exist without communication. Somewhere on the open ground, a broadcast waits. A station has been set up in the field. Find the signal. Find the booth. Find Global Reach."
      },
      {
        "clueNumber": 6,
        "code": "KEY1_HKZ2S3_6",
        "location": "Stairs",
        "clueText": "Near still water and the national emblem of pride, find the stone steps that carry feet away from the splash. Near the fountain, a descent of stone leads away from the centre."
      },
      {
        "clueNumber": 7,
        "code": "KEY1_DEFREA1_7",
        "location": "BOYS ENTRANCE",
        "clueText": "You have moved from entrance to alley, from cabin to field, from fountain to threshold. One final door. The boys' entrance — and within it, the vertical zone reserved for those who ride, not climb. Find the lift area. Your checkpoint waits."
      }
    ]
  },
  {
    "teamId": "PERSEPHONE",
    "clues": [
      {
        "clueNumber": 2,
        "code": "KEY1_ITO2DL62_2",
        "location": "Wall named SWAPNIL",
        "clueText": "In the alley of hunger, something was written and never erased. Not a notice, not a sign — a name claimed on paint, permanent and proud. Find the wall that carries a person's name."
      },
      {
        "clueNumber": 3,
        "code": "KEY1_RRKBQQ8_3",
        "location": "Ramp Entrance",
        "clueText": "Not the back gate, not the main gate — but the entrance bearing a commercial name. At its door, a slope of welcome eases the path from outside to in. Find the ramp at the named entrance."
      },
      {
        "clueNumber": 4,
        "code": "KEY1_SDP7D5C0_4",
        "location": "Global Reach Station",
        "clueText": "Not every answer is hidden. Some are placed in plain sight, in the open, on the grass, where anyone who looks will find them — but only those who were sent will know what to do. The lawn holds your next move. A station waits."
      },
      {
        "clueNumber": 5,
        "code": "KEY1_VEXBY1_5",
        "location": "Lawn",
        "clueText": "Every signal carries noise. Every message has a sender. You have been chasing code across this campus — but code does not exist without communication. Somewhere on the open ground, a broadcast waits. A station has been set up in the field. Find the signal. Find the booth. Find Global Reach."
      },
      {
        "clueNumber": 6,
        "code": "KEY1_GC3XJEYO_6",
        "location": "Stairs",
        "clueText": "Near the water at the campus centre, where the flag pole rises and the seats circle, find the stone descent. The stairs near the fountain lead away from the splash. Go there."
      },
      {
        "clueNumber": 7,
        "code": "KEY1_JQ5ED17_7",
        "location": "BOYS ENTRANCE",
        "clueText": "The final act. The final entrance. Where boys first cross into campus, one structure stands above all others at that gate — not the lift, not the ramp, but the climbing stones of the staircase. Your checkpoint is at its foot."
      }
    ]
  }
];

function buildClueMap(clueDatabase) {
  const clueMap = {};
  for (const team of clueDatabase) {
    for (const clue of team.clues) {
      clueMap[clue.code] = { teamId: team.teamId, clueNumber: clue.clueNumber };
    }
  }
  return clueMap;
}

function validateClueDatabase(clueDatabase) {
  const seenCodes = new Set();
  for (const team of clueDatabase) {
    if (!Array.isArray(team.clues) || team.clues.length !== 6) throw new Error(`Team ${team.teamId} must have exactly 6 clues`);
    const numbers = team.clues.map((c) => c.clueNumber).sort((a, b) => a - b);
    if (numbers.join(",") !== "2,3,4,5,6,7") throw new Error(`Team ${team.teamId} has invalid clue numbers: ${numbers.join(",")}`);
    for (const clue of team.clues) {
      if (!/^KEY1_[A-Z0-9]{6,8}_[2-7]$/.test(clue.code)) throw new Error(`Invalid code format: ${clue.code}`);
      if (seenCodes.has(clue.code)) throw new Error(`Duplicate code detected: ${clue.code}`);
      seenCodes.add(clue.code);
    }
  }
}

validateClueDatabase(CLUE_DATABASE);
const CLUE_MAP = buildClueMap(CLUE_DATABASE);

module.exports = {
  CLUE_DATABASE,
  CLUE_MAP,
  buildClueMap,
};
