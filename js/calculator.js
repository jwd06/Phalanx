import { currentUnit, macroPct } from './app.js'

let lastGoalCalories = null

// Gathering all the fields from the HTML file
export default function calculate() {
    const inputAge = parseInt(document.getElementById("age").value)
    const dropDownGender = document.getElementById("gender").value

    let inputWeight, inputHeight
    if (currentUnit === 'us') {
        inputWeight = parseFloat(document.getElementById("weight").value) * 0.453592
        const ft = parseFloat(document.getElementById("height-ft").value) || 0
        const inches = parseFloat(document.getElementById("height-in").value) || 0
        inputHeight = (ft * 30.48) + (inches * 2.54)
    } else {
        inputWeight = parseFloat(document.getElementById("weight").value)
        inputHeight = parseFloat(document.getElementById("height").value)
    }
    const dropDownActivityLevel = document.getElementById("activity-level").value
    const dropDownGoal = document.getElementById("goal").value
    const dropDownCalorieOffsetWL = document.getElementById("calorie-offset-wl").value
    const dropDownCalorieOffsetGL = document.getElementById("calorie-offset-wg").value

    const error = validationInputs(inputAge, inputWeight, inputHeight)
    if (error){
        const errorMsg = document.getElementById("results")
        errorMsg.innerHTML = `<p style="color:red">${error}</p>`
        document.getElementById("macro-result").innerHTML = ''
        return
    }

    const bmiResult = bmi(inputWeight, inputHeight)
    const tdeeResult = tdee(inputWeight, inputHeight, inputAge, dropDownGender, dropDownActivityLevel)
    const goalCalories = calorieGoal(tdeeResult, dropDownGoal, dropDownCalorieOffsetWL, dropDownCalorieOffsetGL)
    const bmiRangeRes = bmiRange(inputWeight, inputHeight)

    document.getElementById("results").innerHTML = `
        <p>BMI: ${bmiResult.toFixed(2)} Range: ${bmiRangeRes}</p>
        <p>TDEE: ${tdeeResult.toFixed(0)} kcal/day</p>
        <p>Goal Calories: ${goalCalories.toFixed(0)} kcal/day</p>
    `

    lastGoalCalories = goalCalories
    renderMacros(goalCalories)
}

export function refreshMacros() {
    if (lastGoalCalories !== null) renderMacros(lastGoalCalories)
}

function renderMacros(goalCalories) {
    const protein_g = Math.round((goalCalories * macroPct.protein / 100) / 4)
    const carbs_g   = Math.round((goalCalories * macroPct.carbs   / 100) / 4)
    const fat_g     = Math.round((goalCalories * macroPct.fat     / 100) / 9)

    // AMDR (Acceptable Macronutrient Distribution Ranges) from dietary guidelines
    const protein_min = Math.round(goalCalories * 0.10 / 4)
    const protein_max = Math.round(goalCalories * 0.35 / 4)
    const carbs_min   = Math.round(goalCalories * 0.45 / 4)
    const carbs_max   = Math.round(goalCalories * 0.65 / 4)
    const fat_min     = Math.round(goalCalories * 0.20 / 9)
    const fat_max     = Math.round(goalCalories * 0.35 / 9)

    // Reveal mode selector and align slider bounds to AMDR % ranges
    document.getElementById('mac-mode-selector').style.display = 'block'
    const proteinSlider = document.getElementById('proteins-slider')
    const carbsSlider   = document.getElementById('carbohydrates-slider')
    const fatSlider     = document.getElementById('fats-slider')
    proteinSlider.min = 10;  proteinSlider.max = 35
    carbsSlider.min   = 45;  carbsSlider.max   = 65
    fatSlider.min     = 20;  fatSlider.max     = 35

    for (const slider of [proteinSlider, carbsSlider, fatSlider]) {
        const pct = ((parseFloat(slider.value) - parseFloat(slider.min)) / (parseFloat(slider.max) - parseFloat(slider.min))) * 100
        slider.style.background = `linear-gradient(to right, #1a73e8 ${pct}%, #d3d3d3 ${pct}%)`
    }

    document.getElementById('macro-result').innerHTML = `
        <table class="macro-table">
            <tr>
                <td class="macro-label">Protein</td>
                <td class="macro-value">
                    <strong>${protein_g} grams/day</strong>
                    <span class="macro-range">Range: ${protein_min} - ${protein_max}</span>
                </td>
            </tr>
            <tr>
                <td class="macro-label">Carbs</td>
                <td class="macro-value">
                    <strong>${carbs_g} grams/day</strong>
                    <span class="macro-range">Range: ${carbs_min} - ${carbs_max}</span>
                </td>
            </tr>
            <tr>
                <td class="macro-label">Fat</td>
                <td class="macro-value">
                    <strong>${fat_g} grams/day</strong>
                    <span class="macro-range">Range: ${fat_min} - ${fat_max}</span>
                </td>
            </tr>
        </table>
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

const calorieGoal = (tdee, dropDownGoal, dropDownCalorieOffsetWL, dropDownCalorieOffsetGL) =>
{
    switch (dropDownGoal) {
        case "lose-weight":
            switch (dropDownCalorieOffsetWL){
                case "mild":
                    return tdee - 250
                case "extreme":
                    return tdee - 1000
                default:
                    return tdee - 500
            }

        case "gain-weight":
            switch (dropDownCalorieOffsetGL){
                case "mild":
                    return tdee + 250
                case "extreme":
                    return tdee + 1000
                default:
                    return tdee + 500
            }

        default:
            return tdee
    }
}
 
