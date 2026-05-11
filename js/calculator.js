import { currentUnit } from './app.js'

// Gathering all the fields from the HTML file
export default function calculate() {
    const inputAge = parseInt(document.getElementById("age").value)
    const dropDownGender = document.getElementById("gender").value

    let inputWeight, inputHeight
    if (currentUnit === 'us') {
        inputWeight = parseFloat(document.getElementById("weight").value) * 0.453592
        const ft = parseFloat(document.getElementById("height-ft").value) || 0
        const inches = parseFloat(document.getElementById("height-in").value) || 0
        inputHeight = (ft * 12 + inches) * 2.54
    } else {
        inputWeight = parseFloat(document.getElementById("weight").value)
        inputHeight = parseFloat(document.getElementById("height").value)
    }
    const dropDownActivityLevel = document.getElementById("activity-level").value
    const dropDownGoal = document.getElementById("goal").value

    const error = validationInputs(inputAge, inputWeight, inputHeight)
    if (error){
        const errorMsg = document.getElementById("results")
        errorMsg.innerHTML = `<p style="color:red">${error}</p>`
        return
    }

    const bmiResult = bmi(inputWeight, inputHeight)
    const tdeeResult = tdee(inputWeight, inputHeight, inputAge, dropDownGender, dropDownActivityLevel)
    const goalCalories = calorieGoal(tdeeResult, dropDownGoal)
    const bmiRangeRes = bmiRange(inputWeight, inputHeight)

    const resultsDiv = document.getElementById("results")
    resultsDiv.innerHTML = `
        <p>BMI: ${bmiResult.toFixed(2)} Range: ${bmiRangeRes}</p>
        <p>TDEE: ${tdeeResult.toFixed(0)} kcal/day</p>
        <p>Goal Calories: ${goalCalories.toFixed(0)} kcal/day</p>
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
 * Multipliers: sedentary=1.2, light=1.375, moderate=1.55, active=1.725, very active=1.9
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
            multipliers = 1.55
            break
        case "active":
            multipliers = 1.725
            break
        default:
            multipliers = 1.9
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
 * For weight loss: Calorie Goal = TDEE - 500
 * For weight gain: Calorie Goal = TDEE + 500
 * For maintenance: Calorie Goal = TDEE
 */

const calorieGoal = (tdee, dropDownGoal) => 
{
    switch (dropDownGoal) {
        case "lose-weight":
            return tdee - 500
        case "gain-weight":
            return tdee + 500
        default:
            return tdee
    }
}
