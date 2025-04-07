document.addEventListener('DOMContentLoaded', () => {
    // Constants
    const PLATE_WEIGHTS_LBS = [45, 35, 25, 10, 5, 2.5, 1, 0.75, 0.5, 0.25];
    const PLATE_WEIGHTS_KG = [25, 20, 15, 10, 5, 2.5, 2, 1.5, 1, 0.5];
    const KG_TO_LBS = 2.20462;
    const LBS_TO_KG = 0.453592;

    // DOM Elements
    const unitToggle = document.getElementById('unitToggle');
    const barbellWeight = document.getElementById('barbellWeight');
    const targetWeight = document.getElementById('targetWeight');
    const calculateBtn = document.getElementById('calculateBtn');
    const platesLeft = document.querySelector('.plates-left');
    const platesRight = document.querySelector('.plates-right');

    // State
    let isMetric = false;
    // Initialize available plates with their counts
    const availablePlates = new Map([
        [45, 8],   // 8 pairs of 45s
        [35, 0],   // 0 pairs of 35s
        [25, 4],   // 4 pairs of 25s
        [10, 4],   // 4 pairs of 10s
        [5, 4],    // 4 pairs of 5s
        [2.5, 4],  // 4 pairs of 2.5s
        [1, 2],    // 1 pair of 1s
        [0.75, 2], // 1 pair of 0.75s
        [0.5, 2],  // 1 pair of 0.5s
        [0.25, 2]  // 1 pair of 0.25s
    ]);

    // Initialize plate counters
    initializePlateCounters();

    // Event Listeners
    unitToggle.addEventListener('change', toggleUnits);
    calculateBtn.addEventListener('click', calculatePlateCombination);

    function initializePlateCounters() {
        const plateOptions = document.querySelector('.plate-options');
        plateOptions.innerHTML = ''; // Clear existing options

        // Get the appropriate weights based on the current unit system
        const weights = isMetric ? PLATE_WEIGHTS_KG : PLATE_WEIGHTS_LBS;
        
        // Create a temporary map to store the current counts
        const tempCounts = new Map();
        for (const [weight, count] of availablePlates) {
            tempCounts.set(weight, count);
        }

        // Clear the available plates map
        availablePlates.clear();

        weights.forEach((weight) => {
            // For metric, convert the weight to lbs to find the count
            // For imperial, use the weight directly
            const weightInLbs = isMetric ? weight * KG_TO_LBS : weight;
            const count = tempCounts.get(weightInLbs) || 0;
            
            // Store the count in the available plates map
            availablePlates.set(weight, count);

            const plateOption = document.createElement('div');
            plateOption.className = 'plate-option';
            
            const weightSpan = document.createElement('span');
            weightSpan.textContent = isMetric ? 
                `${weight} kg` : 
                `${weight} lb`;
            
            const counter = document.createElement('div');
            counter.className = 'counter';
            
            const decrementBtn = document.createElement('button');
            decrementBtn.className = 'decrement';
            decrementBtn.textContent = '-';
            
            const countSpan = document.createElement('span');
            countSpan.className = 'count';
            countSpan.textContent = count.toString();
            
            const incrementBtn = document.createElement('button');
            incrementBtn.className = 'increment';
            incrementBtn.textContent = '+';
            
            counter.appendChild(decrementBtn);
            counter.appendChild(countSpan);
            counter.appendChild(incrementBtn);
            
            plateOption.appendChild(weightSpan);
            plateOption.appendChild(counter);
            
            plateOptions.appendChild(plateOption);

            // Add event listeners
            incrementBtn.addEventListener('click', () => {
                const currentCount = availablePlates.get(weight) || 0;
                availablePlates.set(weight, currentCount + 1);
                countSpan.textContent = currentCount + 1;
            });

            decrementBtn.addEventListener('click', () => {
                const currentCount = availablePlates.get(weight) || 0;
                if (currentCount > 0) {
                    availablePlates.set(weight, currentCount - 1);
                    countSpan.textContent = currentCount - 1;
                }
            });
        });
    }

    function toggleUnits() {
        isMetric = unitToggle.checked;
        
        // Update target weight placeholder
        targetWeight.placeholder = isMetric ? "Enter target weight (kg)" : "Enter target weight (lbs)";
        
        // If there's a value in the target weight field, convert it
        const currentTarget = targetWeight.value;
        if (currentTarget !== '') {
            const numValue = parseFloat(currentTarget);
            if (!isNaN(numValue)) {
                targetWeight.value = isMetric ? 
                    (numValue * LBS_TO_KG).toFixed(1) : 
                    (numValue * KG_TO_LBS).toFixed(1);
            }
        }

        // Update barbell weight options
        const currentValue = barbellWeight.value;
        barbellWeight.innerHTML = '';
        const weights = [25, 30, 35, 40, 45, 50, 55, 60];
        weights.forEach(weight => {
            const option = document.createElement('option');
            option.value = weight; // Always store lbs value
            option.textContent = isMetric ? 
                `${(weight * LBS_TO_KG).toFixed(1)} kg` : 
                `${weight} lbs`;
            option.selected = weight === parseInt(currentValue);
            barbellWeight.appendChild(option);
        });

        // Reinitialize plate counters with new unit system
        initializePlateCounters();
    }

    function calculatePlateCombination() {
        const barbellWeightValue = parseFloat(barbellWeight.value);
        let targetWeightValue = parseFloat(targetWeight.value);
        
        if (isNaN(targetWeightValue)) {
            showError(`Please enter a valid target weight in ${isMetric ? 'kilograms' : 'pounds'}`);
            return;
        }

        // Convert target weight to lbs if in metric mode
        const targetWeightInLbs = isMetric ? targetWeightValue * KG_TO_LBS : targetWeightValue;
        const barbellWeightInLbs = barbellWeightValue;

        const weightToAdd = targetWeightInLbs - barbellWeightInLbs;
        if (weightToAdd <= 0) {
            const barbellDisplay = isMetric ? 
                `${(barbellWeightInLbs * LBS_TO_KG).toFixed(1)} kg` : 
                `${barbellWeightInLbs} lbs`;
            showError(`Target weight must be greater than barbell weight (${barbellDisplay})`);
            return;
        }

        // Convert weight to add to the appropriate unit system
        const weightToAddPerSide = isMetric ? 
            (weightToAdd / 2) * LBS_TO_KG : 
            weightToAdd / 2;

        const plateCombination = findPlateCombination(weightToAddPerSide);
        if (!plateCombination) {
            // Calculate maximum possible weight
            let maxPossibleWeight = barbellWeightInLbs;
            for (const [weight, count] of availablePlates) {
                maxPossibleWeight += weight * Math.floor(count / 2) * 2;
            }
            const maxDisplay = isMetric ? 
                `${(maxPossibleWeight * LBS_TO_KG).toFixed(1)} kg` : 
                `${maxPossibleWeight} lbs`;
            showError(`Cannot achieve exact target weight with available plates. Maximum possible weight is ${maxDisplay}.`);
            return;
        }

        displayPlateCombination(plateCombination);
    }

    function findPlateCombination(targetWeightPerSide) {
        const combination = new Map();
        let remainingWeight = targetWeightPerSide;
        let maxPossibleWeight = 0;

        // Get the appropriate plate weights based on the current unit system
        const plateWeights = isMetric ? 
            PLATE_WEIGHTS_KG : 
            PLATE_WEIGHTS_LBS;

        // Sort plates in descending order
        const sortedPlates = [...plateWeights].sort((a, b) => b - a);

        // First, calculate maximum possible weight with available plates
        for (const plateWeight of sortedPlates) {
            const availableCount = availablePlates.get(plateWeight) || 0;
            if (availableCount === 0) continue;
            maxPossibleWeight += Math.floor(availableCount / 2) * plateWeight;
        }

        // If we can't reach the target weight, return null
        if (maxPossibleWeight < targetWeightPerSide) {
            return null;
        }

        // Now try to find the best combination
        for (const plateWeight of sortedPlates) {
            const availableCount = availablePlates.get(plateWeight) || 0;
            if (availableCount === 0) continue;

            // Calculate maximum number of pairs we can use
            const maxPairs = Math.min(
                Math.floor(remainingWeight / plateWeight),
                Math.floor(availableCount / 2)
            );

            if (maxPairs > 0) {
                combination.set(plateWeight, maxPairs * 2);
                remainingWeight -= maxPairs * plateWeight;
            }

            if (remainingWeight === 0) break;
        }

        // If we still have remaining weight, it means we couldn't achieve the exact target
        if (remainingWeight > 0) {
            return null;
        }

        return combination;
    }

    function displayPlateCombination(combination) {
        // Clear previous plates
        platesLeft.innerHTML = '';
        platesRight.innerHTML = '';

        // Convert Map to array and sort by weight (heaviest first)
        const sortedPlates = Array.from(combination.entries())
            .sort((a, b) => b[0] - a[0]); // Sort by weight in descending order

        // Calculate total number of plates per side
        let totalPlatesPerSide = 0;
        for (const [weight, totalCount] of sortedPlates) {
            totalPlatesPerSide += totalCount / 2;
        }

        // Update container class based on number of plates
        const container = document.querySelector('.plates-container');
        container.className = 'plates-container'; // Reset classes
        if (totalPlatesPerSide <= 2) {
            container.classList.add('few-plates');
        } else if (totalPlatesPerSide <= 4) {
            container.classList.add('medium-plates');
        } else {
            container.classList.add('many-plates');
        }

        // Create plates for both sides in sorted order
        for (const [weight, totalCount] of sortedPlates) {
            // Since we stored total count, divide by 2 to get count per side
            const countPerSide = totalCount / 2;
            for (let i = 0; i < countPerSide; i++) {
                const plate = createPlateElement(weight);
                platesLeft.appendChild(plate.cloneNode(true));
                platesRight.appendChild(plate);
            }
        }
    }

    function createPlateElement(weight) {
        const plate = document.createElement('div');
        plate.className = 'plate ' + getWeightClass(weight);
        plate.textContent = isMetric ? 
            `${(weight * LBS_TO_KG).toFixed(1)} kg` : 
            `${weight} lb`;
        return plate;
    }

    function getWeightClass(weight) {
        // For metric units, convert to lbs for comparison
        const weightInLbs = isMetric ? weight * KG_TO_LBS : weight;
        
        // Round to 1 decimal place to handle floating point comparison
        const roundedWeight = Math.round(weightInLbs * 10) / 10;

        // Match the pound values from the chart
        switch (roundedWeight) {
            case 55.1:
            case 55.12: return 'weight-25';  // 25kg = 55.12 lbs
            case 44.1:
            case 44.09: return 'weight-20';  // 20kg = 44.09 lbs
            case 33.1:
            case 33.07: return 'weight-15';  // 15kg = 33.07 lbs
            case 22.0:
            case 22.05: return 'weight-10';  // 10kg = 22.05 lbs
            case 11.0:
            case 11.02: return 'weight-5';   // 5kg = 11.02 lbs
            case 5.5:
            case 5.51: return 'weight-2-5';  // 2.5kg = 5.51 lbs
            case 4.4:
            case 4.41: return 'weight-2';    // 2kg = 4.41 lbs
            case 3.3:
            case 3.31: return 'weight-1-5';  // 1.5kg = 3.31 lbs
            case 2.2:
            case 2.20: return 'weight-1';    // 1kg = 2.20 lbs
            case 1.1:
            case 1.10: return 'weight-0-5';  // 0.5kg = 1.10 lbs
            // Common pound plates that don't match kg conversions
            case 45: return 'weight-20';     // Treat 45lb as blue (closest to 20kg)
            case 35: return 'weight-15';     // Treat 35lb as yellow (closest to 15kg)
            case 25: return 'weight-10';     // Treat 25lb as green (closest to 10kg)
            case 10: return 'weight-5';      // Treat 10lb as white (closest to 5kg)
            case 5: return 'weight-2-5';     // Treat 5lb as red (closest to 2.5kg)
            case 2.5: return 'weight-1';     // Treat 2.5lb as green (closest to 1kg)
            case 1.25: return 'weight-0-5';  // Treat 1.25lb as white (closest to 0.5kg)
            default: return 'weight-other';
        }
    }

    function showError(message) {
        // Create or get error message element
        let errorElement = document.getElementById('error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'error-message';
            errorElement.className = 'error-message';
            document.body.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Hide error after 3 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 3000);
    }

    // Add error message styling
    const style = document.createElement('style');
    style.textContent = `
        .error-message {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #ff4444;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            display: none;
        }
    `;
    document.head.appendChild(style);
}); 