-- ============================================================
-- ASSET TRANSFER LIFECYCLE
-- Operational KPI Queries
-- ============================================================


-- 1. Total de transferências
SELECT
    COUNT(*) AS total_transfers
FROM asset_transfers;


-- 2. Distribuição por status do ciclo de vida
SELECT
    lifecycle_status,
    COUNT(*) AS total_transfers
FROM asset_transfers
GROUP BY lifecycle_status
ORDER BY total_transfers DESC;


-- 3. Transferências fora do SLA
SELECT
    COUNT(*) AS outside_sla
FROM asset_transfers
WHERE sla_status = 'Outside SLA';


-- 4. Transferências dentro do SLA
SELECT
    COUNT(*) AS within_sla
FROM asset_transfers
WHERE sla_status = 'Within SLA';


-- 5. Exceções operacionais
SELECT
    exception_type,
    COUNT(*) AS total_exceptions
FROM asset_transfers
WHERE exception_flag = 1
GROUP BY exception_type
ORDER BY total_exceptions DESC;


-- 6. Transferências por nível de risco
SELECT
    operational_risk,
    COUNT(*) AS total_transfers
FROM asset_transfers
GROUP BY operational_risk
ORDER BY
    CASE operational_risk
        WHEN 'Critical' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Medium' THEN 3
        WHEN 'Low' THEN 4
    END;


-- 7. Operações críticas que exigem intervenção
SELECT
    transfer_id,
    client_id,
    asset_name,
    ticker,
    requested_value,
    current_stage,
    lifecycle_status,
    sla_status,
    operational_risk,
    risk_score,
    risk_drivers
FROM asset_transfers
WHERE operational_risk = 'Critical'
ORDER BY risk_score DESC, requested_value DESC;


-- 8. Valor financeiro total das transferências
SELECT
    ROUND(SUM(requested_value), 2) AS total_requested_value
FROM asset_transfers;


-- 9. Valor financeiro das operações fora do SLA
SELECT
    ROUND(SUM(requested_value), 2) AS value_outside_sla
FROM asset_transfers
WHERE sla_status = 'Outside SLA';


-- 10. Valor financeiro envolvido em exceções
SELECT
    ROUND(SUM(requested_value), 2) AS value_with_exceptions
FROM asset_transfers
WHERE exception_flag = 1;


-- 11. Reconciliações com divergência
SELECT
    reconciliation_result,
    COUNT(*) AS total_transfers,
    ROUND(SUM(ABS(value_difference)), 2) AS total_value_difference
FROM asset_transfers
WHERE reconciliation_result <> 'Matched'
GROUP BY reconciliation_result
ORDER BY total_transfers DESC;


-- 12. Divergências por custodiante de destino
SELECT
    destination_custodian,
    COUNT(*) AS total_divergences
FROM asset_transfers
WHERE reconciliation_result <> 'Matched'
GROUP BY destination_custodian
ORDER BY total_divergences DESC;


-- 13. Gargalos do ciclo de vida
SELECT
    current_stage,
    COUNT(*) AS total_transfers
FROM asset_transfers
WHERE lifecycle_status <> 'Completed'
GROUP BY current_stage
ORDER BY total_transfers DESC;


-- 14. Operações por custodiante de origem
SELECT
    origin_custodian,
    COUNT(*) AS total_transfers,
    ROUND(SUM(requested_value), 2) AS total_value
FROM asset_transfers
GROUP BY origin_custodian
ORDER BY total_transfers DESC;


-- 15. Operações por custodiante de destino
SELECT
    destination_custodian,
    COUNT(*) AS total_transfers,
    ROUND(SUM(requested_value), 2) AS total_value
FROM asset_transfers
GROUP BY destination_custodian
ORDER BY total_transfers DESC;


-- 16. Performance por equipe responsável
SELECT
    responsible_team,
    COUNT(*) AS total_transfers,
    SUM(CASE WHEN sla_status = 'Outside SLA' THEN 1 ELSE 0 END)
        AS outside_sla,
    SUM(CASE WHEN exception_flag = 1 THEN 1 ELSE 0 END)
        AS exceptions,
    SUM(CASE WHEN operational_risk IN ('High', 'Critical') THEN 1 ELSE 0 END)
        AS high_risk
FROM asset_transfers
GROUP BY responsible_team
ORDER BY high_risk DESC;


-- 17. Operações com maior valor financeiro e risco
SELECT
    transfer_id,
    asset_name,
    ticker,
    requested_value,
    operational_risk,
    risk_score,
    sla_status,
    exception_type,
    reconciliation_result
FROM asset_transfers
WHERE operational_risk IN ('High', 'Critical')
ORDER BY requested_value DESC
LIMIT 20;


-- 18. Matriz de risco por estágio
SELECT
    current_stage,
    operational_risk,
    COUNT(*) AS total_transfers
FROM asset_transfers
GROUP BY current_stage, operational_risk
ORDER BY current_stage, total_transfers DESC;


-- 19. Tempo médio de processamento
SELECT
    ROUND(AVG(elapsed_days), 2) AS average_elapsed_days
FROM asset_transfers;


-- 20. Operações pendentes de reconciliação
SELECT
    COUNT(*) AS pending_reconciliation
FROM asset_transfers
WHERE reconciliation_status = 'Pending';
