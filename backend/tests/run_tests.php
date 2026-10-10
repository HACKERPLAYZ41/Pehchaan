<?php
declare(strict_types=1);

/**
 * Pehchaan (पहचान) - Test Suite & Benchmark Runner
 * Executes unit tests for all pure algorithmic functions and prints precision/recall metrics.
 */

// PSR-4 autoloader for standalone CLI execution
spl_autoload_register(function ($class) {
    $prefix = 'Pehchaan\\';
    $baseDir = __DIR__ . '/../src/';

    if (str_starts_with($class, 'Pehchaan\\Tests\\')) {
        $testClass = substr($class, strlen('Pehchaan\\Tests\\'));
        $file = __DIR__ . '/' . str_replace('\\', '/', $testClass) . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

use Pehchaan\Engine\Normaliser;
use Pehchaan\Engine\StringDistance;
use Pehchaan\Engine\TokenAnalyzer;
use Pehchaan\Engine\ImageHash;
use Pehchaan\Engine\ShingleJaccard;
use Pehchaan\Engine\ExclusionFilter;
use Pehchaan\Engine\DetectionEngine;
use Pehchaan\Tests\Benchmark\PrecisionRecallBenchmark;

$passCount = 0;
$failCount = 0;

function assertTest(string $name, bool $condition, string $details = '') {
    global $passCount, $failCount;
    if ($condition) {
        $passCount++;
        echo "  [PASS] {$name}\n";
    } else {
        $failCount++;
        echo "  [FAIL] {$name} - {$details}\n";
    }
}

echo "===============================================================================\n";
echo "           PEHCHAAN (पहचान) - UNIT TEST & BENCHMARK SUITE                     \n";
echo "===============================================================================\n\n";

// --- 1. NORMALISER TESTS ---
echo "1. Testing Normaliser (NFKC & Homoglyph Skeletons)...\n";
$cyrillicTest = Normaliser::toSkeleton('lumоrа'); // with cyrillic 'о' and 'а'
assertTest("Cyrillic homoglyph to ASCII", $cyrillicTest === 'lumora', "Got: '{$cyrillicTest}'");

$leetTest = Normaliser::toSkeleton('Lum0ra_B@nk', true);
assertTest("Leetspeak conversion", $leetTest === 'lumora_bank', "Got: '{$leetTest}'");

$stripTest = Normaliser::stripSeparators('Lumora-Bank.Official__2026!');
assertTest("Strip separators preserves digits", $stripTest === 'lumorabankofficial2026', "Got: '{$stripTest}'");

// --- 2. STRING DISTANCE TESTS ---
echo "\n2. Testing StringDistance (Damerau-Levenshtein & Jaro-Winkler)...\n";
$dlSame = StringDistance::damerauLevenshtein('lumora', 'lumora');
assertTest("Damerau-Levenshtein identical", $dlSame === 0, "Distance: {$dlSame}");

$dlTransposition = StringDistance::damerauLevenshtein('lumora', 'lumroa');
assertTest("Damerau-Levenshtein transposition cost 1", $dlTransposition === 1, "Distance: {$dlTransposition}");

$dlSub = StringDistance::damerauLevenshtein('lumora', 'lumara');
assertTest("Damerau-Levenshtein substitution cost 1", $dlSub === 1, "Distance: {$dlSub}");

$jwIdentical = StringDistance::jaroWinkler('lumorabank', 'lumorabank');
assertTest("Jaro-Winkler identical is 1.0", abs($jwIdentical - 1.0) < 0.001, "JW: {$jwIdentical}");

$jwTypo = StringDistance::jaroWinkler('lumorabank', 'lumorabamk');
assertTest("Jaro-Winkler single typo > 0.90", $jwTypo >= 0.90, "JW: {$jwTypo}");

$diff = StringDistance::computeCharacterDiff('Lumora', 'Lum0ra');
assertTest("Character diff computation", count($diff) === 6 && $diff[3]['type'] === 'substitute');

// --- 3. TOKEN ANALYZER TESTS ---
echo "\n3. Testing TokenAnalyzer (Phishing Modifiers & Benign Filters)...\n";
$tokPhish = TokenAnalyzer::analyzeTokens('Lumora Bank', 'lumora-support-kyc.bsky.social');
assertTest("Phishing keywords detected in handle", count($tokPhish['detected_modifiers']) >= 2 && $tokPhish['brand_contained']);

$tokBenign = TokenAnalyzer::analyzeTokens('Lumora Bank', 'Luminara Foods and Healthy Organic Kitchen');
assertTest("Benign industry words recognized", $tokBenign['is_benign_industry'] === true);

// --- 4. IMAGE HASH & HAMMING TESTS ---
echo "\n4. Testing ImageHash (dHash & Hamming Distance)...\n";
$distIdentical = ImageHash::hammingDistance('f0e0c0800080c0f0', 'f0e0c0800080c0f0');
assertTest("Hamming distance of identical hashes is 0", $distIdentical === 0, "Got: {$distIdentical}");

$dist1Bit = ImageHash::hammingDistance('f0e0c0800080c0f0', 'f0e0c0800080c0f1');
assertTest("Hamming distance of 1-bit difference is 1", $dist1Bit === 1, "Got: {$dist1Bit}");

$distUnrelated = ImageHash::hammingDistance('f0e0c0800080c0f0', '0011223344556677');
assertTest("Hamming distance of unrelated hashes is high", $distUnrelated >= 20, "Got: {$distUnrelated}");

// --- 5. SHINGLE JACCARD TESTS ---
echo "\n5. Testing ShingleJaccard (Bio/Description Similarity)...\n";
$bio1 = "Lumora Bank is a next-generation digital financial services institution providing secure savings.";
$bio2 = "Lumora Bank is a next-generation digital financial services institution providing secure savings.";
$jaccardSame = ShingleJaccard::similarity($bio1, $bio2, 2);
assertTest("Shingle Jaccard identical descriptions is 1.0", abs($jaccardSame - 1.0) < 0.001, "Got: {$jaccardSame}");

$bioUnrelated = "Artisanal organic bakery and Mediterranean cafe dining with fresh sourdough bread.";
$jaccardDiff = ShingleJaccard::similarity($bio1, $bioUnrelated, 2);
assertTest("Shingle Jaccard unrelated descriptions is 0.0", $jaccardDiff === 0.0, "Got: {$jaccardDiff}");

// --- 6. EXCLUSION FILTER TESTS ---
echo "\n6. Testing ExclusionFilter (Official Whitelist Integrity)...\n";
$officialAssets = [
    ['asset_type' => 'handle_bsky', 'asset_value' => 'lumorabank.bsky.social'],
    ['asset_type' => 'app_play_package', 'asset_value' => 'com.lumora.mobilebank'],
    ['asset_type' => 'domain', 'asset_value' => 'lumorabank.com'],
];
$exCheck1 = ExclusionFilter::isOfficialOrAllowlisted('lumorabank.bsky.social', 'bluesky', $officialAssets);
assertTest("Official Bluesky handle strictly excluded", $exCheck1['is_excluded'] === true && $exCheck1['reason'] === 'official_asset_exact_match');

$exCheck2 = ExclusionFilter::isOfficialOrAllowlisted('com.lumora.mobilebank', 'google_play', $officialAssets);
assertTest("Official Google Play package strictly excluded", $exCheck2['is_excluded'] === true);

$exCheck3 = ExclusionFilter::isOfficialOrAllowlisted('lumorabank-fake.bsky.social', 'bluesky', $officialAssets);
assertTest("Impostor handle is NOT excluded", $exCheck3['is_excluded'] === false);

// --- 7. PRODUCTION ARCHITECTURE & RELIABILITY TESTS ---
echo "\n7. Testing Production Architecture (Transactions, Idempotency, Circuit Breaker, RED Metrics)...\n";

use Pehchaan\Core\Database;
use Pehchaan\Core\IdempotencyGuard;
use Pehchaan\Core\CircuitBreaker;
use Pehchaan\Core\Metrics;

// A. Database Transactions
try {
    Database::transaction(function ($pdo) {
        $pdo->exec("CREATE TABLE IF NOT EXISTS _test_tx (val TEXT)");
        $pdo->exec("INSERT INTO _test_tx (val) VALUES ('committed')");
    });
    $checkTx = Database::getConnection()->query("SELECT val FROM _test_tx WHERE val = 'committed'")->fetch();
    assertTest("Database Transaction Commits Atomic Work", $checkTx !== false && $checkTx['val'] === 'committed');

    // Rollback test
    try {
        Database::transaction(function ($pdo) {
            $pdo->exec("INSERT INTO _test_tx (val) VALUES ('should_rollback')");
            throw new Exception("Simulated error inside transaction");
        });
    } catch (\Throwable) {}

    $checkRollback = Database::getConnection()->query("SELECT val FROM _test_tx WHERE val = 'should_rollback'")->fetch();
    assertTest("Database Transaction Rolls Back On Exception", $checkRollback === false);
    Database::getConnection()->exec("DROP TABLE IF EXISTS _test_tx");
} catch (\Throwable $e) {
    assertTest("Database Transaction execution", false, $e->getMessage());
}

// B. Idempotency Guard
$idGuard = new IdempotencyGuard();
$testKey = 'idemp_test_' . uniqid();
$wsId = 'ws_test_123';
$path = '/api/brand';
$body = ['brand_name' => 'Lumora Security'];

$firstCheck = $idGuard->check($testKey, $wsId, $path, $body);
assertTest("Idempotency key initially reports new/unseen", $firstCheck === null);

$acquired = $idGuard->acquire($testKey, $wsId, $path, $body);
assertTest("Idempotency key lock acquired", $acquired === true);

$inFlightCheck = $idGuard->check($testKey, $wsId, $path, $body);
assertTest("In-flight duplicate request returns 409 Conflict", $inFlightCheck !== null && $inFlightCheck['type'] === 'conflict');

$mismatchCheck = $idGuard->check($testKey, $wsId, $path, ['brand_name' => 'Tampered Name']);
// If still processing or hash changed:
$idGuard->complete($testKey, 200, ['status' => 'success', 'brand_id' => 42]);

$replayCheck = $idGuard->check($testKey, $wsId, $path, $body);
assertTest("Completed idempotency key returns exact cached replay", $replayCheck !== null && $replayCheck['type'] === 'replay' && $replayCheck['body']['brand_id'] === 42);

$mismatchAfter = $idGuard->check($testKey, $wsId, $path, ['brand_name' => 'Tampered Payload']);
assertTest("Mismatched payload for same key rejected with 422", $mismatchAfter !== null && $mismatchAfter['type'] === 'mismatch');

// C. Circuit Breaker
$cb = new CircuitBreaker(Database::getConnection(), 3, 2); // 3 failures threshold, 2s cooldown
$testSvc = 'test_external_api_' . uniqid();

assertTest("Circuit breaker initial state is available/CLOSED", $cb->isAvailable($testSvc) === true);

$cb->recordFailure($testSvc);
$cb->recordFailure($testSvc);
assertTest("Circuit breaker stays closed before threshold", $cb->isAvailable($testSvc) === true);

$cb->recordFailure($testSvc); // 3rd failure trips the breaker
assertTest("Circuit breaker trips to OPEN after threshold", $cb->isAvailable($testSvc) === false);

// Wait for cooldown
sleep(2);
assertTest("Circuit breaker transitions to probe/HALF_OPEN after cooldown", $cb->isAvailable($testSvc) === true);

$cb->recordSuccess($testSvc);
assertTest("Circuit breaker resets to CLOSED on successful recovery", $cb->isAvailable($testSvc) === true);

// D. RED Metrics
$metrics = new Metrics();
$metrics->record('test_http_duration_ms', 45.2, ['route' => '/api/brand']);
$metrics->record('test_http_duration_ms', 12.8, ['route' => '/api/health']);
$summary = $metrics->getSummary(5);
assertTest("RED Metrics records and calculates summary aggregation", isset($summary['metrics']['test_http_duration_ms']) && $summary['metrics']['test_http_duration_ms']['samples'] >= 2);

// --- 8. BENCHMARK SUITE EVALUATION ---
echo "\n===============================================================================\n";
echo "              RUNNING BENCHMARK EVALUATION (76 TEST CASES)                     \n";
echo "===============================================================================\n";

$bench = PrecisionRecallBenchmark::run();
$cm = $bench['confusion_matrix'];
$m = $bench['metrics'];

echo sprintf("Total Ground-Truth Vectors: %d\n", $bench['total_samples']);
echo sprintf("  • Ground-Truth Positives (Threats/Clones): %d\n", $bench['positives_total']);
echo sprintf("  • Ground-Truth Negatives (Benign/Official): %d\n\n", $bench['negatives_total']);

echo "CONFUSION MATRIX:\n";
echo sprintf("  [TP] True Positives:  %2d | [FP] False Positives: %2d\n", $cm['true_positives'], $cm['false_positives']);
echo sprintf("  [FN] False Negatives: %2d | [TN] True Negatives:  %2d\n\n", $cm['false_negatives'], $cm['true_negatives']);

echo "ACCURACY & RELIABILITY METRICS:\n";
echo sprintf("  🏆 PRECISION:   %6.2f%% (Goal: >= 90.0%%)\n", $m['precision']);
echo sprintf("  🎯 RECALL:      %6.2f%% (Goal: >= 95.0%%)\n", $m['recall']);
echo sprintf("  🛡️ SPECIFICITY: %6.2f%%\n", $m['specificity']);
echo sprintf("  ⚡ ACCURACY:    %6.2f%%\n", $m['accuracy']);
echo sprintf("  📊 F1-SCORE:    %6.2f%%\n\n", $m['f1_score']);

$benchPassed = ($m['precision'] >= 90.0 && $m['recall'] >= 95.0 && $cm['false_positives'] === 0);
assertTest("Benchmark Precision >= 90% and Recall >= 95% with 0 False Positives", $benchPassed);

echo "\n===============================================================================\n";
if ($failCount === 0) {
    echo "🎉 ALL TESTS & BENCHMARKS PASSED PERFECTLY ({$passCount} passed, 0 failed)!\n";
    echo "===============================================================================\n";
    exit(0);
} else {
    echo "❌ TEST SUITE FAILED ({$passCount} passed, {$failCount} failed).\n";
    echo "===============================================================================\n";
    exit(1);
}
