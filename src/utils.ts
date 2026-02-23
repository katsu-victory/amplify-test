// src/utils.ts

export const vo2ToMETs = (vo2: number) => vo2 / 3.5;

export const calculatePrescription = (vo2max: number, percent: number = 45) => {
    if (!vo2max) return null;
    const targetVo2 = vo2max * (percent / 100);
    const targetMets = vo2ToMETs(targetVo2);
    return {
        targetMets: targetMets.toFixed(2),
        targetVo2: targetVo2.toFixed(1)
    };
};