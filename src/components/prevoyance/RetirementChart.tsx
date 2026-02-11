import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface RetirementChartProps {
  currentAge: number;
  avsAnnualRent: number;
  lppAnnualRent: number;
  thirdPillarAnnualRent: number;
  childRentAnnual?: number;
  numberOfChildren?: number;
}

const RetirementChart = ({
  currentAge,
  avsAnnualRent,
  lppAnnualRent,
  thirdPillarAnnualRent,
  childRentAnnual = 0,
  numberOfChildren = 0,
}: RetirementChartProps) => {
  const RETIREMENT_AGE = 65;
  const END_AGE = 85;
  const THIRD_PILLAR_END_AGE = 85; // 3ème pilier capital épuisé à 85 ans
  
  // Calculate chart dimensions
  const chartData = useMemo(() => {
    const totalYears = END_AGE - currentAge;
    const yearsToRetirement = RETIREMENT_AGE - currentAge;
    const retirementYears = END_AGE - RETIREMENT_AGE;
    const thirdPillarYears = THIRD_PILLAR_END_AGE - RETIREMENT_AGE;
    
    // Percentages for positioning
    const currentAgePercent = 0;
    const retirementPercent = (yearsToRetirement / totalYears) * 100;
    const endPercent = 100;
    const thirdPillarEndPercent = retirementPercent + ((thirdPillarYears / totalYears) * 100);
    
    // Total child rent (rente d'enfant de retraité)
    const totalChildRent = childRentAnnual * numberOfChildren;
    
    return {
      totalYears,
      yearsToRetirement,
      retirementYears,
      thirdPillarYears,
      currentAgePercent,
      retirementPercent,
      endPercent,
      thirdPillarEndPercent,
      totalChildRent,
    };
  }, [currentAge, childRentAnnual, numberOfChildren]);

  const formatCHF = (value: number) => {
    if (value === 0) return "";
    return new Intl.NumberFormat('fr-CH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + " CHF";
  };

  // If current age is already past retirement, adjust the display
  const isRetired = currentAge >= RETIREMENT_AGE;

  return (
    <div className="w-full mt-8">
      {/* Chart container */}
      <div className="relative h-80 md:h-96">
        {/* Y-axis label */}
        <div className="absolute left-0 top-0 bottom-16 w-24 md:w-32 flex items-center">
          <div className="text-sm text-muted-foreground leading-tight">
            <span className="block">Revenu annuel</span>
            <span className="block">à date en CHF</span>
          </div>
        </div>
        
        {/* Chart area */}
        <div className="absolute left-24 md:left-32 right-0 top-0 bottom-16">
          {/* Vertical dashed line at current age (if not retired) */}
          {!isRetired && (
            <div 
              className="absolute top-0 bottom-0 border-l-2 border-dashed border-muted-foreground/50"
              style={{ left: `${chartData.retirementPercent}%` }}
            />
          )}
          
          {/* Bars container - stacked from bottom */}
          <div className="absolute inset-0 flex flex-col justify-end gap-2 pb-4">
            {/* 3ème pilier - Top bar (stops at 85) */}
            {thirdPillarAnnualRent > 0 && (
              <div 
                className="relative h-16 md:h-20"
                style={{ 
                  marginLeft: `${chartData.retirementPercent}%`,
                  width: `${chartData.endPercent - chartData.retirementPercent}%`
                }}
              >
                <div 
                  className={cn(
                    "absolute inset-0 rounded-full",
                    "bg-gradient-to-r from-muted/60 to-muted/40",
                    "border-2 border-foreground/80",
                    "flex items-center justify-center"
                  )}
                >
                  <span className="text-sm md:text-base font-medium text-foreground">
                    Avoir 3A prévu / par 20ans
                  </span>
                </div>
              </div>
            )}
            
            {/* 2ème pilier - Middle bar */}
            {lppAnnualRent > 0 && (
              <div 
                className="relative h-16 md:h-20"
                style={{ 
                  marginLeft: `${chartData.retirementPercent}%`,
                  width: `${chartData.endPercent - chartData.retirementPercent}%`
                }}
              >
                <div 
                  className={cn(
                    "absolute inset-0 rounded-lg",
                    "bg-muted/30",
                    "border-2 border-foreground/80",
                    "flex items-center justify-center"
                  )}
                >
                  <span className="text-sm md:text-base font-medium text-foreground">
                    Rente annuel 2ème pilier prévue
                  </span>
                </div>
              </div>
            )}
            
            {/* 1er pilier (AVS) - Bottom bar */}
            {avsAnnualRent > 0 && (
              <div 
                className="relative h-16 md:h-20"
                style={{ 
                  marginLeft: `${chartData.retirementPercent}%`,
                  width: `${chartData.endPercent - chartData.retirementPercent}%`
                }}
              >
                <div 
                  className={cn(
                    "absolute inset-0 rounded-lg",
                    "bg-muted/30",
                    "border-2 border-foreground/80",
                    "flex items-center justify-center"
                  )}
                >
                  <span className="text-sm md:text-base font-medium text-foreground">
                    Rente annuel AVS prévu
                    {chartData.totalChildRent > 0 && (
                      <span className="block text-xs text-muted-foreground">
                        + {formatCHF(chartData.totalChildRent)} rente enfant
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
            
            {/* Empty state */}
            {avsAnnualRent === 0 && lppAnnualRent === 0 && thirdPillarAnnualRent === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Configurez vos piliers pour voir la projection
              </div>
            )}
          </div>
        </div>
        
        {/* X-axis labels */}
        <div className="absolute left-24 md:left-32 right-0 bottom-0 h-12">
          {/* Current age label */}
          <div 
            className="absolute text-sm text-muted-foreground"
            style={{ left: '0%' }}
          >
            <span className="block">aujourd'hui (âge</span>
            <span className="block">du client: {currentAge} ans)</span>
          </div>
          
          {/* 65 ans label */}
          <div 
            className="absolute text-sm text-muted-foreground transform -translate-x-1/2"
            style={{ left: `${chartData.retirementPercent}%` }}
          >
            65 ans
          </div>
          
          {/* 85 ans label */}
          <div 
            className="absolute text-sm text-muted-foreground right-0"
          >
            85 ans
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetirementChart;
