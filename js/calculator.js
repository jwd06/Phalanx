import { currentUnit, macroPct } from './app.js'
import { validationInputs } from './validator.js'
import { getRecommendedPlan, renderPersonalizedCard } from './personalized-workout.js'

let lastGoalCalories = null
let lastWeight = null

// Gathering all the fields from the HTML file
export default function calculate() {
    const inputAge = parseInt(document.getElementById("age").value)
    const dropDownGender = document.getElementById("gender").value

    let inputWeight, inputHeight
    if (currentUnit === 'us') {
        inputWeight = parseFloat(document.getElementById("weight").value) * 0.453592
        lastWeight = inputWeight
        const ftValSt = document.getElementById("height-ft").value
        const inchesValSt = document.getElementById("height-in").value

        if (ftValSt === "" && inchesValSt === ""){
            inputHeight = NaN
        }
        else{
            const ft = parseFloat(ftValSt) || 0
            const inches = parseFloat(inchesValSt) || 0
            inputHeight = (ft * 30.48) + (inches * 2.54)
        }


    } else {
        inputWeight = parseFloat(document.getElementById("weight").value)
        lastWeight = inputWeight
        inputHeight = parseFloat(document.getElementById("height").value)
    }
    const dropDownActivityLevel = document.getElementById("activity-level").value
    const dropDownGoal = document.getElementById("goal").value
    const dropDownCalorieOffsetWL = document.getElementById("calorie-offset-wl").value
    const dropDownCalorieOffsetGL = document.getElementById("calorie-offset-wg").value
    const customOffset = parseFloat(document.getElementById("custom-offset-input").value) || 0

    document.getElementById('results-placeholder').style.display = 'none'

    const error = validationInputs(inputAge, inputWeight, inputHeight, currentUnit)
    if (error){
        const errorMsg = document.getElementById("results")
        errorMsg.innerHTML = `<p style="color:red">${error}</p>`
        document.getElementById("macro-result").innerHTML = ''
        return
    }

    const bmiResult = bmi(inputWeight, inputHeight)
    const bmrResult = dropDownGender === 'female'
        ? bmrWOMEN(inputWeight, inputHeight, inputAge)
        : bmrMEN(inputWeight, inputHeight, inputAge)
    const tdeeResult = tdee(inputWeight, inputHeight, inputAge, dropDownGender, dropDownActivityLevel)
    let goalCalories = calorieGoal(tdeeResult, dropDownGoal, dropDownCalorieOffsetWL, dropDownCalorieOffsetGL, customOffset)
    const bmiRangeRes = bmiRange(inputWeight, inputHeight)

    if (goalCalories < bmrResult) {
        document.getElementById("results").innerHTML =
            `<p style="color:red">Warning: your selected plan would put you below your BMR. Please consult a health professional or choose a less aggressive plan.</p>`
        document.getElementById("macro-result").innerHTML = ''
        document.getElementById('mac-mode-selector').style.display = 'none'
        lastGoalCalories = null
        return
    }

    document.getElementById("results").innerHTML = `
        <div class="result-grid">

            <div class="result-card">
                <span class="result-label"><i class="fa-solid fa-fire"></i> Goal Calories</span>
                <span class="result-value">${goalCalories.toFixed(0)}</span>
                <span class="result-sub">kcal/day</span>
            </div>

            <div class="result-card">
                <span class="result-label"><i class="fa-solid fa-weight-scale"></i> BMI</span>
                <span class="result-value" style="color:${bmiColor(bmiRangeRes)}">${bmiResult.toFixed(1)}</span>
                <span class="result-sub" style="color:${bmiColor(bmiRangeRes)}">${bmiRangeRes}</span>
            </div>

            <div class="result-card">
                <span class="result-label">BMR</span>
                <span class="result-value">${bmrResult.toFixed(0)}</span>
                <span class="result-sub">kcal/day</span>
            </div>

            <div class="result-card">
                <span class="result-label">TDEE</span>
                <span class="result-value">${tdeeResult.toFixed(0)}</span>
                <span class="result-sub">kcal/day</span>
            </div>

        </div>
    `

    lastGoalCalories = goalCalories
    renderMacros(goalCalories, lastWeight)
    const plan = getRecommendedPlan(dropDownGoal, dropDownActivityLevel)
    renderPersonalizedCard(plan)
}

export function refreshMacros() {
    if (lastGoalCalories !== null){
        renderMacros(lastGoalCalories, lastWeight)
    }
}

// Redistributes remaining kcal proportionally between the other two macros when
// a custom slider changes, keeping total kcal = lastGoalCalories.
export function redistributeCustomMacros(changedMacro, newVal_g) {
    if (lastGoalCalories === null) return

    //calories per gram of each macro nutrients
    const kcalPerG = { protein: 4, carbs: 4, fat: 9 }
    //stores the entire HTML element, can get value anytime
    const sliders = {
        protein: document.getElementById('proteins-slider'),
        carbs:   document.getElementById('carbohydrates-slider'),
        fat:     document.getElementById('fats-slider')
    }

    //stores the two unchanged macros using filter method
    const [a, b] = ['protein', 'carbs', 'fat'].filter(k => k !== changedMacro)

    //stores the calories for the changed macro nutrients
    const changed_kcal   = newVal_g * kcalPerG[changedMacro]

    //subtracts the changed macro nutrients calories from the goal calorie to find remaining
    const remaining_kcal = lastGoalCalories - changed_kcal


    //gets the grams of the two unchanged macros and converts to kcals
    const old_a_kcal = parseInt(sliders[a].value) * kcalPerG[a]
    const old_b_kcal = parseInt(sliders[b].value) * kcalPerG[b]

    //sums up the two unchanged macro kcals
    const old_sum = old_a_kcal + old_b_kcal

    let new_a_g
    //if the sum is 0, divide equally between 2 macros
    //otherwise, (remaining_kcal * old_a_kcal)/old sum calculates the calories for one of the
    //unchanged macros,
    //then divide by the calorie density to find the gram of one of the unchanged macro
    if (old_sum === 0) {
        new_a_g = Math.round((remaining_kcal / 2) / kcalPerG[a])
    }
    else {
        new_a_g = Math.round((remaining_kcal * old_a_kcal / old_sum) / kcalPerG[a])
    }

    // Clamp a, then derive b from the remainder
    new_a_g = Math.max(parseInt(sliders[a].min), Math.min(parseInt(sliders[a].max), new_a_g))
    let new_b_g = Math.round((remaining_kcal - new_a_g * kcalPerG[a]) / kcalPerG[b])
    new_b_g = Math.max(parseInt(sliders[b].min), Math.min(parseInt(sliders[b].max), new_b_g))




    const finalTotal = (newVal_g * kcalPerG[changedMacro]) + (new_a_g * kcalPerG[a]) + (new_b_g * kcalPerG[b])
    const diff = lastGoalCalories - finalTotal

    //If we're off by more than a few calories abjust the 'b' macro to absorb the remainder
    //as best as possible
    if (Math.abs(diff) > 5){
        new_b_g += Math.round(diff/kcalPerG[b])
    }

    //update ui value inside the html
    sliders[changedMacro].value = newVal_g
    sliders[a].value = new_a_g
    sliders[b].value = new_b_g

    //display the refreshed values to the user
    refreshMacros()
}

const clampSlider = (s) =>
    Math.max(parseInt(s.min), Math.min(parseInt(s.max), parseInt(s.value) || parseInt(s.min)))

function renderMacros(goalCalories, inputWeight) {
    const isCustom = document.getElementById('macro-custom').classList.contains('active-macro')

    document.getElementById('mac-mode-selector').style.display = 'block'
    const proteinSlider = document.getElementById('proteins-slider')
    const carbsSlider = document.getElementById('carbohydrates-slider')
    const fatSlider = document.getElementById('fats-slider')

    let protein_g, carbs_g, fat_g
    let protein_range, carbs_range, fat_range

    if (isCustom) {
        // Protein: g/kg bodyweight bounds
        const proteinMin = Math.round(1.0 * inputWeight)
        const proteinMax = Math.round(2.4 * inputWeight)
        proteinSlider.min = proteinMin;  proteinSlider.max = proteinMax

        // Fat: % of goal calories
        const fatMin = Math.round(goalCalories * 0.15 / 9)
        const fatMax = Math.round(goalCalories * 0.35 / 9)
        fatSlider.min = fatMin;  fatSlider.max = fatMax

        // Carbs: % of goal calories
        const carbsMin = Math.round(goalCalories * 0.20 / 4)
        const carbsMax = Math.round(goalCalories * 0.65 / 4)
        carbsSlider.min = carbsMin;  carbsSlider.max = carbsMax

        // Clamp current values into bounds (in case of mode switch)
        proteinSlider.value = clampSlider(proteinSlider)
        fatSlider.value     = clampSlider(fatSlider)
        carbsSlider.value   = clampSlider(carbsSlider)

        // Enable all three sliders
        proteinSlider.disabled = false
        carbsSlider.disabled   = false
        fatSlider.disabled     = false

        // Read gram values
        protein_g = parseInt(proteinSlider.value)
        carbs_g   = parseInt(carbsSlider.value)
        fat_g     = parseInt(fatSlider.value)

        // Range column shows slider bounds
        protein_range = `${proteinMin} – ${proteinMax} g`
        carbs_range   = `${carbsMin} – ${carbsMax} g`
        fat_range     = `${fatMin} – ${fatMax} g`

        for (const slider of [proteinSlider, carbsSlider, fatSlider]) {
            const pct = ((parseFloat(slider.value) - parseFloat(slider.min)) / (parseFloat(slider.max) - parseFloat(slider.min))) * 100
            slider.style.background = `linear-gradient(to right, #1a73e8 ${pct}%, #d3d3d3 ${pct}%)`
        }

    } else {
        // Balanced mode — fixed percentage formulas (no bodyweight, no sliders)
        protein_g = Math.round(goalCalories * 0.236 / 4)
        carbs_g   = Math.round(goalCalories * 0.517 / 4)
        fat_g     = Math.round(goalCalories * 0.247 / 9)

        proteinSlider.disabled = true
        carbsSlider.disabled   = true
        fatSlider.disabled     = true

        // Range column shows lower – upper bound in grams (same bounds as custom mode)
        const proteinLow  = Math.round(1.0 * inputWeight)
        const proteinHigh = Math.round(2.4 * inputWeight)
        const fatLow      = Math.round(goalCalories * 0.15 / 9)
        const fatHigh     = Math.round(goalCalories * 0.35 / 9)
        const carbsLow    = Math.round(goalCalories * 0.20 / 4)
        const carbsHigh   = Math.round(goalCalories * 0.65 / 4)

        protein_range = `${proteinLow} – ${proteinHigh} g`
        carbs_range   = `${carbsLow} – ${carbsHigh} g`
        fat_range     = `${fatLow} – ${fatHigh} g`
    }

    // Update slider label spans
    document.getElementById('protein-val').textContent = protein_g + ' g'
    document.getElementById('carbs-val').textContent   = carbs_g   + ' g'
    document.getElementById('fats-val').textContent    = fat_g     + ' g'

    // Micronutrients — scaled to goal calories
    const sodium_mg = Math.min(Math.round(goalCalories), 2300)      // ~1mg/kcal, USDA cap 2300mg
    const sugar_g   = Math.round(goalCalories * 0.075 / 4)          // WHO: ~7.5% of energy as free sugars
    const fibre_g   = Math.round(goalCalories * 14 / 1000)          // DGA 2020-2025: 14g/1000kcal

    const sodium_min = 1500;  const sodium_max = 2300               // USDA bounds (mg)
    const sugar_min  = Math.round(goalCalories * 0.05 / 4)
    const sugar_max  = Math.round(goalCalories * 0.10 / 4)
    const fibre_min  = Math.round(goalCalories * 11.5 / 1000)
    const fibre_max  = Math.round(goalCalories * 16.5 / 1000)

    document.getElementById('macro-result').innerHTML = `
        <div class="macro-section">
            <h3 class="macro-heading">Nutrient Targets</h3>
            <div class="macro-cards">
                <div class="macro-card">
                    <span class="macro-card-label">Protein</span>
                    <span class="macro-card-value">${protein_g} g/day</span>
                    <span class="macro-card-range">Range: ${protein_range}</span>
                </div>

                <div class="macro-card">
                    <span class="macro-card-label">Carbohydrate</span>
                    <span class="macro-card-value">${carbs_g} g/day</span>
                    <span class="macro-card-range">Range: ${carbs_range}</span>
                </div>

                <div class="macro-card">
                    <span class="macro-card-label">Fat</span>
                    <span class="macro-card-value">${fat_g} g/day</span>
                    <span class="macro-card-range">Range: ${fat_range}</span>
                </div>


                <div class="macro-card">
                    <span class="macro-card-label">Sodium</span>
                    <span class="macro-card-value">${sodium_mg} mg/day</span>
                    <span class="macro-card-range">Range: ${sodium_min} – ${sodium_max} mg</span>
                </div>


                <div class="macro-card">
                    <span class="macro-card-label">Sugar</span>
                    <span class="macro-card-value">${sugar_g} g/day</span>
                    <span class="macro-card-range">Range: ${sugar_min} – ${sugar_max} g</span>
                </div>


                <div class="macro-card">
                    <span class="macro-card-label">Fibre</span>
                    <span class="macro-card-value">${fibre_g} g/day</span>
                    <span class="macro-card-range">Range: ${fibre_min} – ${fibre_max} g</span>
                </div>

            </div>
        </div>
    `
}

/**
 * BMI calculator
 * Formula: BMI = weight(kg) / (height(m))²
 * Categories: Underweight <18.5, Normal 18.5–24.9, Overweight 25–29.9, Obese ≥30
 */

const bmi = (inputWeight, inputHeight) =>
{
    const heightInMeters = inputHeight/100
    return inputWeight / (heightInMeters * heightInMeters)
}

const bmiRange = (inputWeight, inputHeight) =>
{
    const bmiRes = bmi(inputWeight, inputHeight)
    if (bmiRes < 18.5) return "Underweight"
    if (bmiRes <= 24.9) return "Healthy Weight"
    if (bmiRes <= 29.9) return "Overweight"
    if (bmiRes <= 34.9) return "Obesity Class I"
    if (bmiRes <= 39.9) return "Obesity Class II"
    return "Obesity Class III (Severe)"
}

const bmiColor = (range) => {
    const colors = {
        "Underweight": "#3b82f6",
        "Healthy Weight": "#22c55e",
        "Overweight": "#f59e0b",
        "Obesity Class I": "#ef4444",
        "Obesity Class II": "#dc2626",
        "Obesity Class III (Severe)": "#991b1b"
    }
    return colors[range] ?? "#111"
}

/**
 * Calorie Calculator
 *  Calories — Mifflin-St Jeor Equation:
 * Men:   BMR = 10W + 6.25H - 5A + 5
 * Women: BMR = 10W + 6.25H - 5A - 161
 */

const bmrMEN = (inputWeight, inputHeight, inputAge) =>
{
    return ((10 * inputWeight) + (6.25 * inputHeight) - (5 * inputAge) + 5)
}

const bmrWOMEN = (inputWeight, inputHeight, inputAge) =>
{
    return ((10 * inputWeight) + (6.25 * inputHeight) - (5 * inputAge) - 161)
}

/**
 * TDEE (Total Daily Energy Expenditure)
 * TDEE = BMR × activity multiplier
 * Multipliers: sedentary=1.2, light=1.375, moderate=1.465, active=1.55, very active=1.725, extra active=1.9, athlete=2.2
 */

const tdee = (inputWeight, inputHeight, inputAge, dropDownGender, dropDownActivityLevel) =>
{
    let multipliers = 0
    switch (dropDownActivityLevel) {
        case "sedentary":
            multipliers = 1.2
            break
        case "light":
            multipliers = 1.375
            break
        case "moderate":
            multipliers = 1.465
            break
        case "active":
            multipliers = 1.55
            break
        case "very-active":
            multipliers = 1.725
            break
        case "extra-active":
            multipliers = 1.9
            break
        default:
            multipliers = 2.2
            break
    }
    switch (dropDownGender) {
        case "female":
            return bmrWOMEN(inputWeight, inputHeight, inputAge) * multipliers
        default:
            return bmrMEN(inputWeight, inputHeight, inputAge) * multipliers
    }
}

/**
 * Calorie Goal Adjustment
 * For weight loss: Calorie Goal = TDEE - offset
 * For weight gain: Calorie Goal = TDEE + offset
 * For maintenance: Calorie Goal = TDEE
 */

const calorieGoal = (tdee, dropDownGoal, dropDownCalorieOffsetWL, dropDownCalorieOffsetGL, customOffset) =>
{
    switch (dropDownGoal) {
        case "lose-weight":
            switch (dropDownCalorieOffsetWL){
                case "mild":
                    return tdee - 250
                case "extreme":
                    return tdee - 1000
                case "custom-offset":
                    return tdee - customOffset
                default:
                    return tdee - 500
            }

        case "gain-weight":
            switch (dropDownCalorieOffsetGL){
                case "mild":
                    return tdee + 250
                case "extreme":
                    return tdee + 1000
                case "custom-offset":
                    return tdee + customOffset
                default:
                    return tdee + 500
            }

        default:
            return tdee
    }
}
