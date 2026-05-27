const excercise_db = {

    "Full Body_lose" : [
        { name: "Squat",              sets: 3, reps: "10-12" },
        { name: "Bench Press",        sets: 3, reps: "10-12" },
        { name: "Dumbbell Row",       sets: 3, reps: "10-12" },
        { name: "Overhead Press",     sets: 3, reps: "10-12" },
        { name: "Romanian Deadlift",  sets: 3, reps: "10-12" },
        { name: "Plank",              sets: 3, reps: "30-60s" }
    ],
    "Upper_maintain": [
        { name: "Bench Press",              sets: 3, reps: "8-12" },
        { name: "Bent Over Row",            sets: 3, reps: "8-12" },
        { name: "Overhead Press",           sets: 3, reps: "10-12" },
        { name: "Lat Pulldown",             sets: 3, reps: "10-12" },
        { name: "Dumbbell Flyes",           sets: 3, reps: "10-12" },
        { name: "Bicep Curls / Tricep Pushdowns", sets: 3, reps: "10-12" }
    ],
    "Lower_maintain": [
        { name: "Squat",              sets: 3, reps: "8-12" },
        { name: "Romanian Deadlift",  sets: 3, reps: "10-12" },
        { name: "Leg Press",          sets: 3, reps: "10-12" },
        { name: "Lunges",             sets: 3, reps: "12 each" },
        { name: "Leg Curl",           sets: 3, reps: "10-12" },
        { name: "Calf Raises",        sets: 3, reps: "10-12" }
    ],
    "Push_gain": [
        { name: "Barbell Bench Press",    sets: 4, reps: "6-8" },
        { name: "Overhead Press",         sets: 3, reps: "8-10" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "10-12" },
        { name: "Lateral Raises",         sets: 3, reps: "10-12" },
        { name: "Tricep Dips",            sets: 3, reps: "10-12" },
        { name: "Skull Crushers",         sets: 3, reps: "10-12" }
    ],
    "Pull_gain": [
        { name: "Deadlift",               sets: 4, reps: "5-6" },
        { name: "Pull-ups / Lat Pulldown",sets: 4, reps: "8-10" },
        { name: "Barbell Row",            sets: 3, reps: "8-10" },
        { name: "Cable Row",              sets: 3, reps: "10-12" },
        { name: "Face Pulls",             sets: 3, reps: "12-15" },
        { name: "Barbell Curl",           sets: 3, reps: "10-12" }
    ],
    "Legs_gain": [
        { name: "Barbell Squat",       sets: 4, reps: "6-8" },
        { name: "Romanian Deadlift",   sets: 3, reps: "10-12" },
        { name: "Leg Press",           sets: 3, reps: "10-12" },
        { name: "Walking Lunges",      sets: 3, reps: "12 each" },
        { name: "Leg Curl",            sets: 3, reps: "10-12" },
        { name: "Calf Raises",         sets: 4, reps: "12-15" }
    ]
}


function getRecommendedPlan(goal, activityLevel) {

    //activity multiplier and days
    const daysMap = {
        "sedentary" : 3, 
        "light" : 3,
        "moderate" : 4,
        "active" : 5,
        "very-active" : 5,
        "extra-active" : 6, 
        "athlete" : 6
    }

    const daysPerWeek = daysMap[activityLevel] || 3
    let splitType, rationale, repScheme

    if (goal === "lose-weight"){
        splitType = "full-body"
        repScheme = "10-12 reps · 45-60s rest"
        rationale = "Full-body compound movements maximize calorie burn every session."
    }
    else if (goal === "maintain-weight"){
        splitType = "upper-lower"
        repScheme = "8-12 reps · 60-90s rest"
        rationale = "Upper-Lower balances strength and muscle maintenance across the week."
    }
    else {
        splitType = "ppl"
        repScheme = "6-10 reps · 2-3 mins rest"
        rationale = "Push/Pull/Legs maximizes hypertrophy volume per muscle group."
    }

    return {splitType, daysPerWeek, repScheme, rationale}
    
}

function getExercisesForDay(dayType, goal, fallbackGoal = null){
    const key = `${dayType}_${goal.replace("-weight", "")}`
    const result = excercise_db[key]
    if (result && result.length) return result
    if (fallbackGoal) return excercise_db[`${dayType}_${fallbackGoal}`] || []
    return []
}

function renderExerciseDetails(schedule, goal, splitType = null){
    const section = document.getElementById("exercise-details-section")
    if (!section) return
    const seen = new Set();
    let html = '<h3 class="exercise-section-title">Exercise Details</h3>'

    const splitToGoal = { "ppl": "gain", "upper-lower": "maintain", "full-body": "lose" }
    const fallbackGoal = splitType ? splitToGoal[splitType] : null

    schedule.forEach(label => {
        if (label === "Rest" || seen.has(label)) return
        seen.add(label)

        const exericises = getExercisesForDay(label, goal, fallbackGoal)
        if (!exericises.length) return

        html += `<div class="exercise-day-block">
        <div class="exercise-day-header">${label} Day</div>
        <ul class="exercise-list">
        `
        exericises.forEach(ex => {
            html += `<li class="exercise-row">
            <span class="exercise-name">${ex.name}</span>
            <span class="exercise-volume">${ex.sets} × ${ex.reps}</span>
            </li>
            `
        })

        html += `</ul></div>`
        
    })
    section.innerHTML = html
    section.classList.remove("hidden")
}

function renderPersonalizedCard(plan){
    const card = document.getElementById("recommended-plan-card")
    if (!card) return

    const splitLabels = {
        "full-body": "Full Body Split",
        "upper-lower" : "Upper-Lower Split",
        "ppl" : "Push / Pull / Legs Split"
    }

    card.innerHTML = `
    
        <div class="plan-card">
            <div class="plan-card-header">
                <i class="fa-solid fa-dumbbell"></i>
                <h3>Recommended workout Plan</h3>
            </div>
            <div class="plan-card-body">
                <div class="plan-split-name">${splitLabels[plan.splitType]}</div>
                <div class="plan-meta">${plan.daysPerWeek} days/week &nbsp; ·&nbsp; ${plan.repScheme}</div>
                <p class="plan-rationale">${plan.rationale}</p>
                <button id="view-workout-btn">View in Workout Tab →</button>
            </div>
        </div>
    `
    card.classList.remove("hidden")
}

export {getRecommendedPlan, renderPersonalizedCard, renderExerciseDetails}




