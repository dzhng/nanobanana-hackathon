# Performance Optimization Guide

The hairstyle generation API now supports optional performance parameters to control speed vs quality.

---

## 🚀 Quick Start - How to Use

Pass these optional parameters via FormData:

```javascript
// FAST MODE - Save ~28s (72% faster!)
formData.append('skipRemoveHair', 'true');    // Skip hair removal (-9s)
formData.append('skipRelight', 'true');        // Skip relighting (-11s)
formData.append('numGenerations', '1');        // Just 1 generation (-8s)
formData.append('skipEvaluation', 'true');     // Skip GPT eval (-3s)

// BALANCED MODE - Save ~6s (16% faster)
formData.append('numGenerations', '3');        // Use 3 instead of 5

// DEFAULT MODE - Don't add any parameters (best quality)
```

---

## 📊 Performance Results

| Mode | Time | Savings | When to Use |
|------|------|---------|-------------|
| **Default** | 38.7s | baseline | Best quality, final results |
| **Balanced** | 32.7s | -6s (16%) | Good speed/quality balance ⭐ |
| **Skip Preprocessing** | 11.7s | -27s (70%) | Original has short hair |
| **Fast Mode** | 10.8s | -28s (72%) | Quick previews, rapid testing |

---

## 🎛️ Available Parameters

| Parameter | Type | Default | Savings | Description |
|-----------|------|---------|---------|-------------|
| `skipRemoveHair` | boolean | `false` | ~9s | Skip hair removal preprocessing |
| `skipRelight` | boolean | `false` | ~11s | Skip lighting adjustment |
| `numGenerations` | 1-10 | `5` | varies | Number of parallel generations |
| `skipEvaluation` | boolean | `false` | ~3-5s | Skip GPT best-image selection |

---

## 💡 Recommendations

**For most use cases:** Use `numGenerations: 3` (balanced mode)

**Skip preprocessing when:**
- Original person has very short hair or is bald
- Lighting already matches between images
- Speed is critical for previews

**Use fast mode for:**
- Rapid prototyping
- Testing different hairstyles quickly
- Quick previews before final generation

---

## 🧪 Running Benchmarks

Test all configurations:

```bash
npx tsx benchmark/benchmark-simple.ts
```

This will measure:
1. Default (Full Quality)
2. Balanced (numGenerations=3)
3. Skip Preprocessing Only
4. Fast Mode (All Optimizations)

---

## 📝 Technical Details

**What was discovered:**
- The pipeline does 7 total nano banana API calls (not 5!)
- Preprocessing (removeHair + relight) = 2 API calls taking ~20s
- Main generation = 5 parallel API calls taking ~11-19s
- GPT evaluation adds ~3-5s

**Files modified:**
- `src/app/api/generate-hairstyle/route.ts`
- `src/utils/image/parallel-generation/parallel-generation.ts`

**Backwards compatible:** All parameters are optional, defaults maintain current behavior.
