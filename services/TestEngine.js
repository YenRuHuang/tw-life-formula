/**
 * TestEngine.js - 測驗類工具的計算引擎
 * 處理所有測驗類工具的特殊計算邏輯
 */

class TestEngine {
    /**
     * 執行測驗計算
     * @param {string} toolKey - 工具識別碼
     * @param {Object} inputs - 輸入參數
     * @returns {Object} 計算結果
     */
    static calculate(toolKey, inputs) {
        switch (toolKey) {
            case 'lazy-index-test':
                return this.calculateLazinessIndex(inputs);
            case 'gaming-addiction-calculator':
                return this.calculateGamingAddiction(inputs);
            case 'aging-simulator':
                return this.calculateAgingSimulation(inputs);
            case 'food-expense-shocker':
                return this.calculateFoodExpenseShocker(inputs);
            default:
                throw new Error(`未知的測驗工具: ${toolKey}`);
        }
    }

    /**
     * 懶人指數測試計算
     */
    static calculateLazinessIndex(inputs) {
        const { sleep_hours, exercise_frequency, cooking_frequency, cleaning_frequency, procrastination_level } = inputs;
        
        let score = 0;
        let factors = [];
        
        // 睡眠時間評分 (0-25分)
        if (sleep_hours <= 6) {
            score += 5;
            factors.push('睡眠不足可能讓你更想偷懶');
        } else if (sleep_hours <= 8) {
            score += 10;
            factors.push('睡眠時間適中');
        } else if (sleep_hours <= 10) {
            score += 20;
            factors.push('睡眠時間較長，有懶人傾向');
        } else {
            score += 25;
            factors.push('睡眠時間過長，明顯的懶人特徵');
        }
        
        // 運動頻率評分 (0-25分)
        const exerciseScores = { daily: 0, often: 5, sometimes: 15, rarely: 20, never: 25 };
        score += exerciseScores[exercise_frequency] || 0;
        
        const exerciseTexts = {
            daily: '每天運動，完全不懶！',
            often: '經常運動，還不錯',
            sometimes: '偶爾運動，有點懶了',
            rarely: '很少運動，懶人傾向明顯',
            never: '從不運動，超級懶人！'
        };
        factors.push(exerciseTexts[exercise_frequency] || '');
        
        // 煮飯頻率評分 (0-25分)
        const cookingScores = { daily: 0, often: 8, sometimes: 15, rarely: 20, never: 25 };
        score += cookingScores[cooking_frequency] || 0;
        
        const cookingTexts = {
            daily: '每天下廚，勤勞的表現',
            often: '經常下廚，還算勤快',
            sometimes: '偶爾下廚，偏懶',
            rarely: '幾乎不煮飯，懶人行為',
            never: '從不下廚，徹底的懶人'
        };
        factors.push(cookingTexts[cooking_frequency] || '');
        
        // 打掃頻率評分 (0-25分)
        const cleaningScores = { daily: 0, often: 5, sometimes: 15, rarely: 20, never: 25 };
        score += cleaningScores[cleaning_frequency] || 0;
        
        const cleaningTexts = {
            daily: '每天打掃，超級勤勞',
            often: '經常打掃，維持整潔',
            sometimes: '偶爾打掃，有點懶散',
            rarely: '很少打掃，懶惰傾向',
            never: '從不打掃，極度懶惰'
        };
        factors.push(cleaningTexts[cleaning_frequency] || '');
        
        // 拖延症程度 (額外加分)
        const procrastinationBonus = Math.min(procrastination_level * 2, 20);
        score += procrastinationBonus;
        factors.push(`拖延症程度: ${procrastination_level}/10，額外增加 ${procrastinationBonus} 分`);
        
        // 計算最終分數和等級
        const finalScore = Math.min(score, 100);
        let level, description, advice;
        
        if (finalScore <= 20) {
            level = '勤勞蜜蜂';
            description = '你是一個非常勤勞的人！';
            advice = '保持這樣的好習慣，你已經是生活的模範了！';
        } else if (finalScore <= 40) {
            level = '普通人類';
            description = '你的懶人指數在正常範圍內';
            advice = '適度的懶惰是人之常情，但可以再稍微勤快一點';
        } else if (finalScore <= 60) {
            level = '輕度懶人';
            description = '你已經有明顯的懶人傾向了';
            advice = '是時候改變一些生活習慣了，從小事做起！';
        } else if (finalScore <= 80) {
            level = '中度懶人';
            description = '你的懶惰程度已經影響到生活品質';
            advice = '需要認真考慮改變生活方式，建立更好的習慣';
        } else {
            level = '重度懒人';
            description = '你已經是懶人界的天花板了！';
            advice = '緊急狀況！需要立即採取行動改變生活習慣！';
        }
        
        return {
            value: finalScore,
            unit: '分',
            level,
            description,
            advice,
            factors,
            details: {
                score: finalScore,
                breakdown: {
                    sleep: sleep_hours <= 8 ? '正常' : '偏長',
                    exercise: exercise_frequency,
                    cooking: cooking_frequency,
                    cleaning: cleaning_frequency,
                    procrastination: `${procrastination_level}/10`
                }
            },
            suggestions: [advice, ...factors.slice(0, 3)]
        };
    }

    /**
     * 遊戲成癮計算機
     */
    static calculateGamingAddiction(inputs) {
        const { dailyHours, weeklySpending, socialImpact, workImpact, sleepImpact } = inputs;
        
        let score = 0;
        let riskFactors = [];
        
        // 每日遊戲時間評分 (0-30分)
        if (dailyHours <= 2) {
            score += 5;
            riskFactors.push('遊戲時間適中，很健康');
        } else if (dailyHours <= 4) {
            score += 15;
            riskFactors.push('遊戲時間稍長，需要注意');
        } else if (dailyHours <= 6) {
            score += 25;
            riskFactors.push('遊戲時間過長，有風險');
        } else {
            score += 30;
            riskFactors.push('遊戲時間嚴重超標，高風險');
        }
        
        // 每週花費評分 (0-25分)
        if (weeklySpending <= 100) {
            score += 0;
            riskFactors.push('遊戲花費合理');
        } else if (weeklySpending <= 500) {
            score += 10;
            riskFactors.push('遊戲花費偏高');
        } else if (weeklySpending <= 1000) {
            score += 20;
            riskFactors.push('遊戲花費很高，需要控制');
        } else {
            score += 25;
            riskFactors.push('遊戲花費極高，嚴重超支');
        }
        
        // 社交影響評分 (0-15分)
        score += socialImpact * 1.5;
        if (socialImpact >= 8) {
            riskFactors.push('嚴重影響社交關係');
        } else if (socialImpact >= 5) {
            riskFactors.push('明顯影響社交關係');
        } else if (socialImpact >= 3) {
            riskFactors.push('輕微影響社交關係');
        }
        
        // 工作/學習影響評分 (0-15分)
        score += workImpact * 1.5;
        if (workImpact >= 8) {
            riskFactors.push('嚴重影響工作/學習');
        } else if (workImpact >= 5) {
            riskFactors.push('明顯影響工作/學習');
        } else if (workImpact >= 3) {
            riskFactors.push('輕微影響工作/學習');
        }
        
        // 睡眠影響評分 (0-15分)
        score += sleepImpact * 1.5;
        if (sleepImpact >= 8) {
            riskFactors.push('嚴重影響睡眠品質');
        } else if (sleepImpact >= 5) {
            riskFactors.push('明顯影響睡眠品質');
        } else if (sleepImpact >= 3) {
            riskFactors.push('輕微影響睡眠品質');
        }
        
        const finalScore = Math.min(score, 100);
        let level, description, recommendation;
        
        if (finalScore <= 20) {
            level = '健康玩家';
            description = '你的遊戲習慣很健康！';
            recommendation = '繼續保持良好的遊戲習慣，記得適度休息';
        } else if (finalScore <= 40) {
            level = '輕度風險';
            description = '需要稍加注意遊戲時間和花費';
            recommendation = '建議設定遊戲時間限制，控制消費';
        } else if (finalScore <= 60) {
            level = '中度風險';
            description = '遊戲已開始影響你的生活';
            recommendation = '需要認真考慮減少遊戲時間，尋求平衡';
        } else if (finalScore <= 80) {
            level = '高度風險';
            description = '遊戲嚴重影響你的日常生活';
            recommendation = '強烈建議尋求專業協助，制定戒遊計畫';
        } else {
            level = '極度風險';
            description = '遊戲成癮症狀明顯，需要立即行動';
            recommendation = '緊急！請立即尋求專業醫療協助';
        }
        
        // 計算年度預估花費
        const yearlySpending = weeklySpending * 52;
        
        return {
            score: finalScore,
            level,
            description,
            recommendation,
            riskFactors,
            statistics: {
                dailyHours: `${dailyHours} 小時`,
                weeklySpending: `NT$ ${weeklySpending.toLocaleString()}`,
                yearlySpending: `NT$ ${yearlySpending.toLocaleString()}`,
                impactRating: {
                    social: `${socialImpact}/10`,
                    work: `${workImpact}/10`,
                    sleep: `${sleepImpact}/10`
                }
            }
        };
    }

    /**
     * 變老模擬計算機
     */
    static calculateAgingSimulation(inputs) {
        const { age, smoking, drinking, exercise, diet, stress, sleep } = inputs;
        
        let biologicalAge = parseInt(age);
        let lifeExpectancy = 80; // 基準壽命
        let factors = [];
        
        // 吸菸影響
        if (smoking === 'heavy') {
            biologicalAge += 8;
            lifeExpectancy -= 10;
            factors.push('重度吸菸：生理年齡+8歲，預期壽命-10年');
        } else if (smoking === 'light') {
            biologicalAge += 3;
            lifeExpectancy -= 5;
            factors.push('輕度吸菸：生理年齡+3歲，預期壽命-5年');
        } else {
            factors.push('不吸菸：很好的選擇！');
        }
        
        // 飲酒影響
        if (drinking === 'heavy') {
            biologicalAge += 5;
            lifeExpectancy -= 7;
            factors.push('重度飲酒：生理年齡+5歲，預期壽命-7年');
        } else if (drinking === 'moderate') {
            biologicalAge += 1;
            lifeExpectancy -= 2;
            factors.push('適度飲酒：生理年齡+1歲，預期壽命-2年');
        } else {
            lifeExpectancy += 2;
            factors.push('不飲酒：預期壽命+2年');
        }
        
        // 運動影響
        if (exercise === 'regular') {
            biologicalAge -= 5;
            lifeExpectancy += 8;
            factors.push('規律運動：生理年齡-5歲，預期壽命+8年');
        } else if (exercise === 'occasional') {
            biologicalAge -= 2;
            lifeExpectancy += 3;
            factors.push('偶爾運動：生理年齡-2歲，預期壽命+3年');
        } else {
            biologicalAge += 3;
            lifeExpectancy -= 5;
            factors.push('不運動：生理年齡+3歲，預期壽命-5年');
        }
        
        // 飲食影響
        if (diet === 'healthy') {
            biologicalAge -= 3;
            lifeExpectancy += 5;
            factors.push('健康飲食：生理年齡-3歲，預期壽命+5年');
        } else if (diet === 'average') {
            factors.push('普通飲食：無特殊影響');
        } else {
            biologicalAge += 4;
            lifeExpectancy -= 6;
            factors.push('不健康飲食：生理年齡+4歲，預期壽命-6年');
        }
        
        // 壓力影響
        if (stress >= 8) {
            biologicalAge += 6;
            lifeExpectancy -= 8;
            factors.push('高壓力：生理年齡+6歲，預期壽命-8年');
        } else if (stress >= 5) {
            biologicalAge += 3;
            lifeExpectancy -= 4;
            factors.push('中等壓力：生理年齡+3歲，預期壽命-4年');
        } else {
            biologicalAge -= 1;
            lifeExpectancy += 2;
            factors.push('低壓力：生理年齡-1歲，預期壽命+2年');
        }
        
        // 睡眠影響
        if (sleep >= 7 && sleep <= 8) {
            biologicalAge -= 2;
            lifeExpectancy += 3;
            factors.push('充足睡眠：生理年齡-2歲，預期壽命+3年');
        } else if (sleep < 6 || sleep > 9) {
            biologicalAge += 3;
            lifeExpectancy -= 4;
            factors.push('睡眠不當：生理年齡+3歲，預期壽命-4年');
        } else {
            factors.push('睡眠一般：輕微影響');
        }
        
        // 確保合理範圍
        biologicalAge = Math.max(biologicalAge, age - 10);
        biologicalAge = Math.min(biologicalAge, age + 20);
        lifeExpectancy = Math.max(lifeExpectancy, 60);
        lifeExpectancy = Math.min(lifeExpectancy, 100);
        
        const ageDifference = biologicalAge - age;
        const remainingYears = Math.max(lifeExpectancy - age, 0);
        
        let healthStatus, advice;
        
        if (ageDifference <= -3) {
            healthStatus = '非常健康';
            advice = '你的生活習慣很棒！繼續保持這種健康的生活方式';
        } else if (ageDifference <= 0) {
            healthStatus = '健康';
            advice = '整體健康狀況良好，可以考慮在某些方面再改善一下';
        } else if (ageDifference <= 3) {
            healthStatus = '一般';
            advice = '需要開始關注健康，改善一些不良的生活習慣';
        } else if (ageDifference <= 6) {
            healthStatus = '需要注意';
            advice = '健康狀況不太理想，建議積極改變生活方式';
        } else {
            healthStatus = '警告';
            advice = '健康狀況令人擔憂，強烈建議立即改善生活習慣並諮詢醫生';
        }
        
        return {
            actualAge: age,
            biologicalAge: Math.round(biologicalAge),
            ageDifference: Math.round(ageDifference),
            lifeExpectancy: Math.round(lifeExpectancy),
            remainingYears: Math.round(remainingYears),
            healthStatus,
            advice,
            factors,
            improvements: [
                '戒菸戒酒',
                '規律運動',
                '健康飲食',
                '充足睡眠',
                '減少壓力',
                '定期健檢'
            ]
        };
    }

    /**
     * 外食花費震撼機
     */
    static calculateFoodExpenseShocker(inputs) {
        const { dailyMeals, avgMealCost, cookingFreq, monthlyIncome } = inputs;
        
        // 計算外食費用
        const dailyCost = dailyMeals * avgMealCost;
        const weeklyCost = dailyCost * 7;
        const monthlyCost = dailyCost * 30;
        const yearlyCost = dailyCost * 365;
        
        // 計算在家煮飯的估算成本
        const homeCookingCost = avgMealCost * 0.3; // 假設在家煮飯成本是外食的30%
        const potentialSavings = {
            daily: dailyCost - (dailyMeals * homeCookingCost),
            monthly: monthlyCost - (dailyMeals * homeCookingCost * 30),
            yearly: yearlyCost - (dailyMeals * homeCookingCost * 365)
        };
        
        // 計算佔收入比例
        const incomePercentage = (monthlyCost / monthlyIncome) * 100;
        
        // 計算震撼指數 (0-100)
        let shockIndex = 0;
        
        // 基於花費金額
        if (yearlyCost >= 200000) shockIndex += 30;
        else if (yearlyCost >= 150000) shockIndex += 25;
        else if (yearlyCost >= 100000) shockIndex += 20;
        else if (yearlyCost >= 50000) shockIndex += 15;
        else shockIndex += 10;
        
        // 基於收入比例
        if (incomePercentage >= 30) shockIndex += 30;
        else if (incomePercentage >= 20) shockIndex += 25;
        else if (incomePercentage >= 15) shockIndex += 20;
        else if (incomePercentage >= 10) shockIndex += 15;
        else shockIndex += 10;
        
        // 基於煮飯頻率
        const cookingMultiplier = {
            never: 1.4,
            rarely: 1.3,
            monthly: 1.2,
            weekly: 1.1,
            daily: 1.0
        };
        shockIndex *= (cookingMultiplier[cookingFreq] || 1.0);
        
        // 基於餐數
        if (dailyMeals >= 3) shockIndex += 10;
        else if (dailyMeals >= 2) shockIndex += 5;
        
        shockIndex = Math.min(Math.round(shockIndex), 100);
        
        // 計算可以買到的東西
        const alternatives = this.calculateAlternatives(yearlyCost);
        
        // 震撼等級評估
        let shockLevel, shockDescription, recommendation;
        
        if (shockIndex <= 30) {
            shockLevel = '還算合理';
            shockDescription = '你的外食支出在可接受範圍內';
            recommendation = '維持現狀即可，偶爾在家煮飯會更健康';
        } else if (shockIndex <= 50) {
            shockLevel = '需要注意';
            shockDescription = '外食支出開始偏高了';
            recommendation = '建議增加在家煮飯的頻率，可以節省不少開銷';
        } else if (shockIndex <= 70) {
            shockLevel = '相當震撼';
            shockDescription = '外食支出已經很高，影響財務規劃';
            recommendation = '強烈建議學習基本料理，大幅減少外食頻率';
        } else if (shockIndex <= 85) {
            shockLevel = '極度震撼';
            shockDescription = '外食支出嚴重超標，財務壓力很大';
            recommendation = '緊急狀況！需要立即改變飲食習慣，學會煮飯';
        } else {
            shockLevel = '震撼到懷疑人生';
            shockDescription = '你的外食支出已經到了令人震驚的程度';
            recommendation = '請立即採取行動！這樣的支出完全不可持續';
        }
        
        return {
            shockIndex,
            shockLevel,
            shockDescription,
            recommendation,
            costs: {
                daily: Math.round(dailyCost),
                weekly: Math.round(weeklyCost),
                monthly: Math.round(monthlyCost),
                yearly: Math.round(yearlyCost)
            },
            savings: {
                daily: Math.round(potentialSavings.daily),
                monthly: Math.round(potentialSavings.monthly),
                yearly: Math.round(potentialSavings.yearly)
            },
            incomePercentage: Math.round(incomePercentage * 10) / 10,
            alternatives,
            cookingBenefits: [
                '每年可省下 NT$ ' + Math.round(potentialSavings.yearly).toLocaleString(),
                '更健康的飲食選擇',
                '培養生活技能',
                '增加家庭時間',
                '減少食品添加物攝取'
            ]
        };
    }
    
    /**
     * 計算年度支出可以買到的替代物品
     */
    static calculateAlternatives(yearlyCost) {
        const alternatives = [];
        
        if (yearlyCost >= 1000000) {
            alternatives.push('一台高級汽車');
        }
        if (yearlyCost >= 500000) {
            alternatives.push('出國旅遊10次');
        }
        if (yearlyCost >= 200000) {
            alternatives.push('一台高級機車');
            alternatives.push('全新iPhone 50支');
        }
        if (yearlyCost >= 100000) {
            alternatives.push('一年的健身房會籍');
            alternatives.push('專業攝影器材一套');
        }
        if (yearlyCost >= 50000) {
            alternatives.push('高級筆電一台');
            alternatives.push('名牌包包5個');
        }
        if (yearlyCost >= 20000) {
            alternatives.push('新手機一支');
            alternatives.push('好吃的牛排 100 份');
        }
        
        return alternatives.slice(0, 5); // 最多返回5個選項
    }
}

module.exports = TestEngine;
