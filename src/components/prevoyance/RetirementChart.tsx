import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface RetirementChartProps {
  currentAge: number;
  annualSalary: number;
  avsAnnualRent: number;
  lppAnnualRent: number;
  thirdPillarAnnualRent: number;
  childRentAnnual?: number;
  numberOfChildren?: number;
}

const COLORS = {
  salary: "hsl(var(--primary))",
  avs: "hsl(220, 70%, 50%)",
  lpp: "hsl(160, 60%, 45%)",
  thirdPillar: "hsl(30, 80%, 55%)",
};

const RetirementChart = ({
  currentAge,
  annualSalary,
  avsAnnualRent,
  lppAnnualRent,
  thirdPillarAnnualRent,
  childRentAnnual = 0,
  numberOfChildren = 0,
}: RetirementChartProps) => {
  const RETIREMENT_AGE = 65;

  const chartData = useMemo(() => {
    const totalChildRent = childRentAnnual * numberOfChildren;
    const avsTotal = avsAnnualRent + totalChildRent;

    // Generate age points: current, then every 5 years, plus 65 and 85
    const ages = new Set<number>();
    ages.add(currentAge);
    for (let a = Math.ceil(currentAge / 5) * 5; a <= 85; a += 5) {
      ages.add(a);
    }
    ages.add(RETIREMENT_AGE);
    ages.add(85);

    const sortedAges = Array.from(ages).sort((a, b) => a - b);

    return sortedAges.map((age) => {
      if (age < RETIREMENT_AGE) {
        return {
          age: `${age} ans`,
          salaire: annualSalary,
          avs: 0,
          lpp: 0,
          troisieme: 0,
        };
      }
      return {
        age: `${age} ans`,
        salaire: 0,
        avs: avsTotal,
        lpp: lppAnnualRent,
        troisieme: thirdPillarAnnualRent,
      };
    });
  }, [currentAge, annualSalary, avsAnnualRent, lppAnnualRent, thirdPillarAnnualRent, childRentAnnual, numberOfChildren]);

  const formatCHF = (value: number) =>
    new Intl.NumberFormat("fr-CH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + " CHF";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold mb-2">{label}</p>
        {payload
          .filter((p: any) => p.value > 0)
          .map((p: any) => (
            <p key={p.dataKey} className="flex justify-between gap-4">
              <span style={{ color: p.fill }}>{p.name}</span>
              <span className="font-medium">{formatCHF(p.value)}</span>
            </p>
          ))}
      </div>
    );
  };

  if (annualSalary === 0 && avsAnnualRent === 0 && lppAnnualRent === 0 && thirdPillarAnnualRent === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Configurez vos piliers et votre salaire pour voir la projection
      </div>
    );
  }

  return (
    <div className="w-full mt-4">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Projection de revenus à la retraite
      </h3>
      <div className="h-80 md:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="age"
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
            {annualSalary > 0 && (
              <ReferenceLine
                y={annualSalary}
                stroke="hsl(var(--destructive))"
                strokeDasharray="6 4"
                strokeWidth={2}
                label={{
                  value: `Salaire: ${formatCHF(annualSalary)}`,
                  position: "top",
                  fontSize: 12,
                  fill: "hsl(var(--destructive))",
                }}
              />
            )}
            <Bar
              dataKey="salaire"
              name="Salaire actuel"
              fill={COLORS.salary}
              stackId="stack"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="avs"
              name="1er pilier (AVS)"
              fill={COLORS.avs}
              stackId="stack"
            />
            <Bar
              dataKey="lpp"
              name="2ème pilier (LPP)"
              fill={COLORS.lpp}
              stackId="stack"
            />
            <Bar
              dataKey="troisieme"
              name="3ème pilier"
              fill={COLORS.thirdPillar}
              stackId="stack"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RetirementChart;
