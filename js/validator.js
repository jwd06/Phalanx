export const ageValid = (age) =>
{
    if (isNaN(age)) return "Age is required"
    if(!Number.isInteger(age)) return "Age must be a whole number"
    if (age < 13 || age > 80) return "Age must be between 13 and 80"
}

export const weightValid = (weight, unit) =>
{
    if (isNaN(weight) || weight === "") return "Weight is required"
    if (unit === "metric"){
        if (weight < 1 || weight > 500) return "Weight must be between 1 and 500 kg"
    }
    else {
        //US Check: convert kg to lbs
        const weightInLbs = weight * 2.20462
        if (weightInLbs < 1 || weightInLbs > 500) return "Weight must be between 1 and 500 lbs"
    }

}

export const heightValid = (height, unit) =>
{
    if (isNaN(height) || height === "") return "Height is required"
    if (unit === "metric"){
        if (height < 50 || height > 300) return "Height must be between 50 and 300 cm"
    }
    else{
        //convert cm back to feet
        const heightInFeet = height / 30.48;
        if (heightInFeet < 1|| heightInFeet > 10) return "Height must be between 1 feet and 10 feet"
    }

}

export const validationInputs = (age, weight, height, unit) =>
{
    return (
    ageValid(age) ||
    weightValid(weight, unit) ||
    heightValid(height, unit) ||
    null
    )
}
