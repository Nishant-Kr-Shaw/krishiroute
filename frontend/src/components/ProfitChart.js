import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';
import './ProfitChart.css';

const ProfitChart = ({ results, bestMandiName }) => {
    const { t } = useTranslation();

    if (!results || results.length === 0) return null;

    // Prepare data for chart
    const chartData = results.map(result => {
        const translatedName = t('mandis.' + result.mandi, result.mandi);
        return {
            name: translatedName.length > 15 ? translatedName.substring(0, 15) + '...' : translatedName,
            fullName: translatedName,
            [t('chart.netProfit')]: result.netProfit,
            [t('chart.revenue')]: result.revenue,
            [t('chart.totalCost')]: result.totalCost,
        };
    });

    // Sort by profit descending
    chartData.sort((a, b) => b[t('chart.netProfit')] - a[t('chart.netProfit')]);

    // Custom tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-title">{payload[0].payload.fullName}</p>
                    <p className="tooltip-item revenue">
                        <span className="tooltip-label">{t('chart.revenue')}:</span>
                        <span className="tooltip-value">₹{payload[0].payload[t('chart.revenue')].toLocaleString()}</span>
                    </p>
                    <p className="tooltip-item cost">
                        <span className="tooltip-label">{t('chart.totalCost')}:</span>
                        <span className="tooltip-value">₹{payload[0].payload[t('chart.totalCost')].toLocaleString()}</span>
                    </p>
                    <p className="tooltip-item profit">
                        <span className="tooltip-label">{t('chart.netProfit')}:</span>
                        <span className="tooltip-value">₹{payload[0].payload[t('chart.netProfit')].toLocaleString()}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-container">
            <h3 className="chart-title">📈 {t('chart.title')}</h3>
            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            style={{ fontSize: '0.85rem', fontFamily: 'Inter' }}
                        />
                        <YAxis
                            style={{ fontSize: '0.85rem', fontFamily: 'Inter' }}
                            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ paddingTop: '20px', fontFamily: 'Inter' }}
                        />
                        <Bar dataKey={t('chart.netProfit')} radius={[8, 8, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.fullName === bestMandiName ? '#ffd700' : '#667eea'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>

                <div className="chart-insights">
                    <div className="insight-card">
                        <div className="insight-icon">💰</div>
                        <div className="insight-content">
                            <div className="insight-label">{t('chart.highestProfit')}</div>
                            <div className="insight-value">₹{Math.max(...chartData.map(d => d[t('chart.netProfit')])).toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="insight-card">
                        <div className="insight-icon">📊</div>
                        <div className="insight-content">
                            <div className="insight-label">{t('chart.profitRange')}</div>
                            <div className="insight-value">
                                ₹{(Math.max(...chartData.map(d => d[t('chart.netProfit')])) - Math.min(...chartData.map(d => d[t('chart.netProfit')]))).toLocaleString()}
                            </div>
                        </div>
                    </div>
                    <div className="insight-card">
                        <div className="insight-icon">🎯</div>
                        <div className="insight-content">
                            <div className="insight-label">{t('chart.averageProfit')}</div>
                            <div className="insight-value">
                                ₹{Math.round(chartData.reduce((sum, d) => sum + d[t('chart.netProfit')], 0) / chartData.length).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfitChart;
