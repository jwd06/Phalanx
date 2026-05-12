const ageValid = (age) =>
{
    if (isNaN(age) || age === "") return "Age is required"
    if(!Number.isInteger(age)) return "Age must be a whole number"
    if (age < 1 || age > 120) return "Age must be between 1 and 120"
}

const weightValid = (weight) =>
{
    if (isNaN(weight) || weight === "") return "Weight is required"
    if (weight < 1 || weight > 500) return "Weight must be between 1 and 500 kg"
}

const heightValid = (height) =>
{
    if (isNaN(height) || height === "") return "Height is required"
    if (height < 50 || height > 300) return "Height must be between 50 and 300 cm"
}

const validationInputs = (age, weight, height) =>
{
    return (
    ageValid(age) ||
    weightValid(weight) ||
    heightValid(height) ||
    null
    )
}
