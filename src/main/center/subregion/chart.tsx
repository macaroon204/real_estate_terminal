import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer
} from 'recharts';

export default function SubRegionChart({ series }: {
  series: any[]
}){

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={series}>
        <XAxis dataKey="ym" />
        <YAxis domain={['auto', 'auto']} />
        <Tooltip />

        <Line
          type="monotone"
          dataKey="index_value"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
