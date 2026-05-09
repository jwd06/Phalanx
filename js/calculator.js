// Gathering all the fields from the HTML file
function calculate() {
    const inputAge = parseInt(document.getElementById("age").value)
    const inputWeight = parseFloat(document.getElementById("weight").value)
    const inputHeight = parseFloat(document.getElementById("height").value)
    const dropDownGender = document.getElementById("gender").value
    const dropDownActivityLevel = document.getElementById("activity-level").value
    const dropDownGoal = document.getElementById("goal").value

    const bmiResult = bmi(inputWeight, inputHeight)
    const tdeeResult = tdee(inputWeight, inputHeight, inputAge, dropDownGender, dropDownActivityLevel)
    const goalCalories = calorieGoal(tdeeResult, dropDownGoal)

    console.log(`BMI: ${bmiResult}`)
    console.log(`TDEE: ${tdeeResult}`)
    console.log(`Goal Calorie: ${goalCalories}`)
}

/**
 * BMI calculator
 * Formula: BMI = weight(kg) / (height(m))²
 * Categories: Underweight <18.5, Normal 18.5–24.9, Overweight 25–29.9, Obese ≥30
 */

const bmi = (inputWeight, inputHeight) => 
{
    return inputWeight / (inputHeight * inputHeight)
}

/**
 * Calorie Calculator
 *  Calories — Harris-Benedict BMR formula
 * Men:   BMR = 88.362 + (13.397 × kg) + (4.799 × cm) − (5.677 × age)
 * Women: BMR = 447.593 + (9.247 × kg) + (3.098 × cm) − (4.330 × age)
 */

const bmrMEN = (inputWeight, inputHeight, inputAge) =>
{
    return 88.362 + (13.397 * inputWeight) + (4.799 * inputHeight) - (5.677 * inputAge)
}

const bmrWOMEN = (inputWeight, inputHeight, inputAge) =>
{
    return 447.593 + (9.247 * inputWeight) + (3.098 * inputHeight) - (4.330 * inputAge)
}

/**
 * TDEE (Total Daily Energy Expenditure)
 * TDEE = BMR × activity multiplier
 * Multipliers: sedentary=1.2, light=1.375, moderate=1.55, active=1.725, very active=1.9
 */

const tdee = (inputWeight, inputHeight, inputAge, dropDownGender, dropDownActivityLevel) => {
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
        case "weight-loss":
            return tdee - 500
        case "weight-gain":
            return tdee + 500
        default:
            return tdee
    }
}
