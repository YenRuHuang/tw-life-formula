/**
 * TestEngine.test.js - TestEngine 類別的單元測試
 */

const TestEngine = require('../services/TestEngine');

describe('TestEngine', () => {
    describe('calculate', () => {
        test('應該正確路由到對應的測驗工具', () => {
            const lazyInputs = {
                sleep_hours: 8,
                exercise_frequency: 'sometimes',
                cooking_frequency: 'rarely',
                cleaning_frequency: 'often',
                procrastination_level: 5
            };

            const result = TestEngine.calculate('lazy-index-test', lazyInputs);
            
            expect(result).toBeDefined();
            expect(result.value).toBeDefined();
            expect(result.unit).toBe('分');
            expect(result.level).toBeDefined();
        });

        test('應該在未知工具時拋出錯誤', () => {
            expect(() => {
                TestEngine.calculate('unknown-tool', {});
            }).toThrow('未知的測驗工具: unknown-tool');
        });
    });

    describe('calculateLazinessIndex', () => {
        test('應該計算勤勞蜜蜂等級', () => {
            const inputs = {
                sleep_hours: 7,
                exercise_frequency: 'daily',
                cooking_frequency: 'daily',
                cleaning_frequency: 'daily',
                procrastination_level: 2
            };

            const result = TestEngine.calculateLazinessIndex(inputs);
            
            expect(result.value).toBeLessThanOrEqual(20);
            expect(result.level).toBe('勤勞蜜蜂');
            expect(result.unit).toBe('分');
            expect(result.description).toContain('勤勞');
        });

        test('應該計算重度懶人等級', () => {
            const inputs = {
                sleep_hours: 12,
                exercise_frequency: 'never',
                cooking_frequency: 'never',
                cleaning_frequency: 'never',
                procrastination_level: 10
            };

            const result = TestEngine.calculateLazinessIndex(inputs);
            
            expect(result.value).toBeGreaterThan(80);
            expect(result.level).toBe('重度懒人');
            expect(result.unit).toBe('分');
            expect(result.factors).toBeInstanceOf(Array);
            expect(result.suggestions).toBeInstanceOf(Array);
        });

        test('應該處理中等懶人範圍', () => {
            const inputs = {
                sleep_hours: 9,
                exercise_frequency: 'sometimes',
                cooking_frequency: 'rarely',
                cleaning_frequency: 'sometimes',
                procrastination_level: 6
            };

            const result = TestEngine.calculateLazinessIndex(inputs);
            
            expect(result.value).toBeGreaterThan(40);
            expect(result.value).toBeLessThanOrEqual(85);
            expect(['輕度懶人', '中度懶人', '重度懒人']).toContain(result.level);
        });
    });

    describe('calculateGamingAddiction', () => {
        test('應該計算健康玩家等級', () => {
            const inputs = {
                daily_gaming_hours: 2,
                monthly_gaming_expense: 300,
                gaming_years: 3,
                skip_meals_for_gaming: 'never',
                lose_sleep_for_gaming: 'rarely'
            };

            const result = TestEngine.calculateGamingAddiction(inputs);
            
            expect(result.value).toBeLessThanOrEqual(20);
            expect(result.level).toBe('健康玩家');
            expect(result.unit).toBe('分');
            expect(result.details.statistics.dailyHours).toBe('2 小時');
        });

        test('應該計算極度風險等級', () => {
            const inputs = {
                daily_gaming_hours: 12,
                monthly_gaming_expense: 8000,
                gaming_years: 15,
                skip_meals_for_gaming: 'always',
                lose_sleep_for_gaming: 'always'
            };

            const result = TestEngine.calculateGamingAddiction(inputs);
            
            expect(result.value).toBeGreaterThan(80);
            expect(result.level).toBe('極度風險');
            expect(result.riskFactors).toBeInstanceOf(Array);
            expect(result.riskFactors.length).toBeGreaterThan(0);
        });

        test('應該正確計算年度花費', () => {
            const inputs = {
                daily_gaming_hours: 4,
                monthly_gaming_expense: 1500,
                gaming_years: 5,
                skip_meals_for_gaming: 'sometimes',
                lose_sleep_for_gaming: 'often'
            };

            const result = TestEngine.calculateGamingAddiction(inputs);
            
            expect(result.details.statistics.monthlySpending).toBe('NT$ 1,500');
            expect(result.details.statistics.yearlySpending).toBe('NT$ 18,000');
        });
    });

    describe('calculateAgingSimulation', () => {
        test('應該計算非常健康狀態', () => {
            const inputs = {
                current_age: 30,
                exercise_level: 'intense',
                smoking_status: 'never',
                drinking_frequency: 'never',
                sleep_quality: 'excellent',
                stress_level: 3
            };

            const result = TestEngine.calculateAgingSimulation(inputs);
            
            expect(result.value).toBeLessThan(30);
            expect(result.level).toBe('非常健康');
            expect(result.unit).toBe('歲');
            expect(result.details.ageDifference).toBeLessThan(0);
        });

        test('應該計算警告狀態', () => {
            const inputs = {
                current_age: 40,
                exercise_level: 'never',
                smoking_status: 'heavy',
                drinking_frequency: 'heavy',
                sleep_quality: 'poor',
                stress_level: 9
            };

            const result = TestEngine.calculateAgingSimulation(inputs);
            
            expect(result.value).toBeGreaterThan(40);
            expect(result.level).toBe('警告');
            expect(result.details.ageDifference).toBeGreaterThan(6);
            expect(result.factors).toBeInstanceOf(Array);
        });

        test('應該在合理範圍內限制生理年齡', () => {
            const inputs = {
                current_age: 25,
                exercise_level: 'never',
                smoking_status: 'heavy',
                drinking_frequency: 'heavy',
                sleep_quality: 'poor',
                stress_level: 10
            };

            const result = TestEngine.calculateAgingSimulation(inputs);
            
            // 生理年齡不應該比實際年齡小超過10歲或大超過20歲
            expect(result.value).toBeGreaterThanOrEqual(15); // 25-10
            expect(result.value).toBeLessThanOrEqual(45);    // 25+20
        });
    });

    describe('calculateFoodExpenseShocker', () => {
        test('應該計算還算合理等級', () => {
            const inputs = {
                breakfast_expense: 30,
                lunch_expense: 80,
                dinner_expense: 100,
                snack_expense: 20,
                delivery_frequency: 2,
                age: 25
            };

            const result = TestEngine.calculateFoodExpenseShocker(inputs);
            
            expect(result.value).toBeLessThanOrEqual(40);
            expect(['還算合理', '需要注意']).toContain(result.level);
            expect(result.unit).toBe('分');
            expect(result.details.costs.daily).toBe(230);
        });

        test('應該計算震撼到懷疑人生等級', () => {
            const inputs = {
                breakfast_expense: 200,
                lunch_expense: 300,
                dinner_expense: 500,
                snack_expense: 100,
                delivery_frequency: 20,
                age: 30
            };

            const result = TestEngine.calculateFoodExpenseShocker(inputs);
            
            expect(result.value).toBeGreaterThan(85);
            expect(result.level).toBe('震撼到懷疑人生');
            expect(result.details.costs.yearly).toBeGreaterThan(300000);
        });

        test('應該正確計算節省金額', () => {
            const inputs = {
                breakfast_expense: 50,
                lunch_expense: 120,
                dinner_expense: 180,
                snack_expense: 30,
                delivery_frequency: 5,
                age: 28
            };

            const result = TestEngine.calculateFoodExpenseShocker(inputs);
            
            expect(result.details.savings.daily).toBeGreaterThan(0);
            expect(result.details.savings.yearly).toBeGreaterThan(0);
            expect(result.details.breakdown.breakfast).toBe(50);
            expect(result.details.breakdown.lunch).toBe(120);
        });

        test('應該根據年齡估算收入', () => {
            const youngInputs = {
                breakfast_expense: 100,
                lunch_expense: 100,
                dinner_expense: 100,
                snack_expense: 50,
                delivery_frequency: 5,
                age: 22 // 年輕人
            };

            const oldInputs = {
                ...youngInputs,
                age: 40 // 較年長
            };

            const youngResult = TestEngine.calculateFoodExpenseShocker(youngInputs);
            const oldResult = TestEngine.calculateFoodExpenseShocker(oldInputs);
            
            // 年紀大的人估算月薪較高，所以收入百分比應該較低
            expect(oldResult.details.incomePercentage).toBeLessThan(youngResult.details.incomePercentage);
        });
    });

    describe('calculateAlternatives', () => {
        test('應該為高額費用返回合適的替代品', () => {
            const alternatives = TestEngine.calculateAlternatives(200000);
            
            expect(alternatives).toBeInstanceOf(Array);
            expect(alternatives.length).toBeGreaterThan(0);
            expect(alternatives.length).toBeLessThanOrEqual(5);
            expect(alternatives).toContain('一台高級機車');
        });

        test('應該為低額費用返回較少的替代品', () => {
            const alternatives = TestEngine.calculateAlternatives(30000);
            
            expect(alternatives).toBeInstanceOf(Array);
            expect(alternatives.length).toBeGreaterThan(0);
            expect(alternatives).toContain('新手機一支');
        });

        test('應該為極高額費用包含頂級物品', () => {
            const alternatives = TestEngine.calculateAlternatives(1200000);
            
            expect(alternatives).toBeInstanceOf(Array);
            expect(alternatives).toContain('一台高級汽車');
        });
    });

    describe('結果格式驗證', () => {
        test('所有測驗工具應該返回一致的結果格式', () => {
            const tools = [
                {
                    key: 'lazy-index-test',
                    inputs: {
                        sleep_hours: 8,
                        exercise_frequency: 'sometimes',
                        cooking_frequency: 'rarely',
                        cleaning_frequency: 'often',
                        procrastination_level: 5
                    }
                },
                {
                    key: 'gaming-addiction-calculator',
                    inputs: {
                        daily_gaming_hours: 5,
                        monthly_gaming_expense: 1000,
                        gaming_years: 7,
                        skip_meals_for_gaming: 'sometimes',
                        lose_sleep_for_gaming: 'often'
                    }
                },
                {
                    key: 'aging-simulator',
                    inputs: {
                        current_age: 35,
                        exercise_level: 'moderate',
                        smoking_status: 'light',
                        drinking_frequency: 'moderate',
                        sleep_quality: 'fair',
                        stress_level: 6
                    }
                },
                {
                    key: 'food-expense-shocker',
                    inputs: {
                        breakfast_expense: 60,
                        lunch_expense: 150,
                        dinner_expense: 200,
                        snack_expense: 40,
                        delivery_frequency: 8,
                        age: 30
                    }
                }
            ];

            tools.forEach(tool => {
                const result = TestEngine.calculate(tool.key, tool.inputs);
                
                // 檢查必要欄位
                expect(result.value).toBeDefined();
                expect(typeof result.value).toBe('number');
                expect(result.unit).toBeDefined();
                expect(result.level).toBeDefined();
                expect(result.description).toBeDefined();
                expect(result.advice).toBeDefined();
                expect(result.details).toBeDefined();
                expect(result.suggestions).toBeInstanceOf(Array);
                
                // 檢查值的合理範圍
                expect(result.value).toBeGreaterThanOrEqual(0);
                expect(result.value).toBeLessThanOrEqual(1000);
            });
        });
    });
});
