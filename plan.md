 # BMI & Calorie Calculator — Architecture Plan

 ## Context

 The user is learning JavaScript by building a real project: a BMI + calorie calculator for weight gain/loss goals.
  The focus is understanding how to get user inputs from HTML, process them in JS, and display results back in
 HTML. CSS is out of scope for now.

 Current state: three empty JS files (app.js, calculator.js, validator.js). No HTML file exists yet.

 ---
 File Structure (Validated + Extended)

 index.html/
 style.css/
 js/
 ├── app.js            ← wire HTML ↔ JS (event listeners, DOM updates)
 ├── calculator.js     ← pure calculation logic (BMI, TDEE, goal calories)
 └── validator.js      ← input validation (checks before calculating)

 Why this structure works for learning JS:

 - index.html — you see how forms and DOM elements work
 - calculator.js — you learn pure functions (input in, number out, no side effects)
 - validator.js — you learn guard clauses and returning error messages
 - app.js — you learn DOM manipulation: querySelector, addEventListener, innerHTML

 The existing 3-file split is correct. Only thing missing is index.html.

 ---
 Inputs (HTML Form)

 ┌────────────────┬─────────────────┬─────────────────────────────────────────────────────┐
 │     Field      │      Type       │                        Notes                        │
 ├────────────────┼─────────────────┼─────────────────────────────────────────────────────┤
 │ Age            │ number          │ years                                               │
 ├────────────────┼─────────────────┼─────────────────────────────────────────────────────┤
 │ Gender         │ radio or select │ male / female                                       │
 ├────────────────┼─────────────────┼─────────────────────────────────────────────────────┤
 │ Height         │ number          │ cm                                                  │
 ├────────────────┼─────────────────┼─────────────────────────────────────────────────────┤
 │ Weight         │ number          │ kg                                                  │
 ├────────────────┼─────────────────┼─────────────────────────────────────────────────────┤
 │ Activity Level │ select          │ sedentary / light / moderate / active / very active │
 ├────────────────┼─────────────────┼─────────────────────────────────────────────────────┤
 │ Goal           │ select          │ lose / maintain / gain                              │
 └────────────────┴─────────────────┴─────────────────────────────────────────────────────┘

 ---
 calculator.js — Logic

 BMI

 BMI = weight(kg) / (height(m))²
 Categories: Underweight <18.5, Normal 18.5–24.9, Overweight 25–29.9, Obese ≥30

 Calories — Harris-Benedict BMR formula

 Men:   BMR = 88.362 + (13.397 × kg) + (4.799 × cm) − (5.677 × age)
 Women: BMR = 447.593 + (9.247 × kg) + (3.098 × cm) − (4.330 × age)

 TDEE (Total Daily Energy Expenditure)

 TDEE = BMR × activity multiplier
 Multipliers: sedentary=1.2, light=1.375, moderate=1.55, active=1.725, very active=1.9

 Goal adjustment

 Lose weight:     target = TDEE - 500 cal/day
 Maintain weight: target = TDEE
 Gain weight:     target = TDEE + 500 cal/day

 Exports: calculateBMI(weight, height), calculateCalories(weight, height, age, gender, activity, goal)

 ---
 validator.js — Validation

 Checks before any calculation runs:
 - Age: must be a number, 1–120
 - Height: must be a number, > 0
 - Weight: must be a number, > 0
 - Gender: must be "male" or "female"
 - Activity: must be one of the 5 valid values
 - Goal: must be one of the 3 valid values

 Export: validateInputs(inputs) — returns { valid: true } or { valid: false, errors: [...] }

 ---
 app.js — Orchestration

 1. Select DOM elements (form, result div, inputs)
 2. Listen for form submit event
 3. On submit: read all input values → call validateInputs() → if invalid show errors → if valid call
 calculateBMI() + calculateCalories() → write results into result div

 Key JS concepts this teaches:
 - document.querySelector / getElementById
 - addEventListener('submit', ...)
 - event.preventDefault() (stop page reload)
 - Reading .value from inputs
 - String interpolation with template literals
 - innerHTML to display results

 ---
 Data Flow

 [HTML Form inputs]
       ↓ (user submits)
 [app.js] reads values
       ↓
 [validator.js] checks inputs
       ↓ (if valid)
 [calculator.js] runs math
       ↓
 [app.js] writes results to DOM
       ↓
 [HTML results div] shows output

 ---
 Files to Create/Modify

 ┌───────────────┬────────┬───────────────────────────────────────────┐
 │     File      │ Action │                  Purpose                  │
 ├───────────────┼────────┼───────────────────────────────────────────┤
 │ index.html    │ CREATE │ Form inputs + results display area        │
 ├───────────────┼────────┼───────────────────────────────────────────┤
 │ calculator.js │ WRITE  │ BMI + TDEE + goal calorie functions       │
 ├───────────────┼────────┼───────────────────────────────────────────┤
 │ validator.js  │ WRITE  │ validateInputs() function                 │
 ├───────────────┼────────┼───────────────────────────────────────────┤
 │ app.js        │ WRITE  │ DOM wiring, event handling, orchestration │
 └───────────────┴────────┴───────────────────────────────────────────┘

 ---
 Verification

 1. Open index.html in a browser
 2. Enter valid values → results section shows BMI value + category + daily calorie target
 3. Enter invalid values (letters, empty fields) → error messages appear without calculating
 4. Change goal from "lose" to "gain" → calorie target changes by ~1000 cal/day
 5. Change gender → calorie result changes (different BMR formula)