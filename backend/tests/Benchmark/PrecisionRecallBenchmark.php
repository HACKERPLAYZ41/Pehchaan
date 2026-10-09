<?php
declare(strict_types=1);

namespace Pehchaan\Tests\Benchmark;

use Pehchaan\Engine\DetectionEngine;

/**
 * Benchmark Evaluation Suite for Pehchaan Algorithmic Detection Engine
 * Measures Precision, Recall, Specificity, F1-Score, and Confusion Matrix against curated test vectors.
 */
class PrecisionRecallBenchmark
{
    public static function run(): array
    {
        $profile = DatasetFixture::getBrandProfile();
        $testEntities = DatasetFixture::getTestEntities();

        $tp = 0; // True Positive: Actual Positive correctly flagged as High/Critical/Medium
        $fp = 0; // False Positive: Actual Negative wrongly flagged as High/Critical/Medium
        $tn = 0; // True Negative: Actual Negative correctly classified as Official or Low
        $fn = 0; // False Negative: Actual Positive missed (classified as Low/Official)

        $detailedResults = [];

        foreach ($testEntities as $item) {
            $expected = $item['expected'];
            $cand = $item['candidate'];
            $id = $item['id'];

            $res = DetectionEngine::evaluate($profile, $cand);
            $score = $res['composite_score'];
            $sev = $res['severity'];
            $isOfficial = $res['is_official'];

            // A threat is considered "Flagged / Positive" if score >= 40 and severity is MEDIUM, HIGH, or CRITICAL
            $flagged = ($score >= 40 && in_array($sev, ['MEDIUM', 'HIGH', 'CRITICAL'], true) && !$isOfficial);

            $classification = '';
            if ($expected === 'POSITIVE') {
                if ($flagged) {
                    $tp++;
                    $classification = 'TP (True Positive)';
                } else {
                    $fn++;
                    $classification = 'FN (False Negative - Missed)';
                }
            } else { // NEGATIVE
                if ($flagged) {
                    $fp++;
                    $classification = 'FP (False Positive - Overflagged)';
                } else {
                    $tn++;
                    $classification = 'TN (True Negative - Correctly Suppressed)';
                }
            }

            $detailedResults[] = [
                'id' => $id,
                'handle' => $cand['handle'] ?? '',
                'expected' => $expected,
                'score' => $score,
                'severity' => $sev,
                'is_official' => $isOfficial,
                'signals_count' => count($res['signals']),
                'classification' => $classification,
            ];
        }

        $total = count($testEntities);
        $precision = ($tp + $fp) > 0 ? (float)($tp / ($tp + $fp)) : 1.0;
        $recall = ($tp + $fn) > 0 ? (float)($tp / ($tp + $fn)) : 1.0;
        $specificity = ($tn + $fp) > 0 ? (float)($tn / ($tn + $fp)) : 1.0;
        $accuracy = (float)(($tp + $tn) / $total);
        $f1 = ($precision + $recall) > 0 ? (float)(2 * ($precision * $recall) / ($precision + $recall)) : 0.0;

        return [
            'total_samples' => $total,
            'positives_total' => $tp + $fn,
            'negatives_total' => $tn + $fp,
            'confusion_matrix' => [
                'true_positives' => $tp,
                'false_positives' => $fp,
                'true_negatives' => $tn,
                'false_negatives' => $fn,
            ],
            'metrics' => [
                'precision' => round($precision * 100, 2),
                'recall' => round($recall * 100, 2),
                'specificity' => round($specificity * 100, 2),
                'accuracy' => round($accuracy * 100, 2),
                'f1_score' => round($f1 * 100, 2),
            ],
            'detailed_results' => $detailedResults,
        ];
    }
}
