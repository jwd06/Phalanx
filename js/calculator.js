// Gathering all the fields from the HTML file
const inputAge = document.getElementById("age").value
const inputWeight = document.getElementById("weight").value
const inputHeight = document.getElementById("height").value
const dropDownGender = document.getElementById("gender").value
const dropDownActivityLevel = document.getElementById("activity-level").value
const dropDownGoal = document.getElementById("goal")

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

const tdeeMEN = () => {
    var multipliers = 0
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
    bmrMEN(inputWeight, inputHeight, inputAge) * multipliers

}
