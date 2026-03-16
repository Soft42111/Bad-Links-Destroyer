const { normalizeLink } = require('./utils');

const testCases = [
    {
        "label": "Basic Link",
        "obfuscated": "https://example.com/normal",
        "expected": "https://example.com/normal"
    },
    {
        "label": "Line Break Obfuscation (Protocol)",
        "obfuscated": "h\nt\nt\np\ns://example.com",
        "expected": "https://example.com"
    },
    {
        "label": "Line Break Obfuscation (Domain)",
        "obfuscated": "https://ex\nam\nple.com/test",
        "expected": "https://example.com/test"
    },
    {
        "label": "Character Spacing Bypass",
        "obfuscated": "h t t p s : / / d u m m y . o r g",
        "expected": "https://dummy.org"
    },
    {
        "label": "Irregular Spacing in Path",
        "obfuscated": "https://testproject.io / p a t h / t e s t",
        "expected": "https://testproject.io/path/test"
    },
    {
        "label": "Markdown Bold/Italic Injection",
        "obfuscated": "https://**example**.com/_test_path_",
        "expected": "https://example.com/testpath"
    },
    {
        "label": "Markdown Quote Block",
        "obfuscated": "> https://dummy.org/restricted",
        "expected": "https://dummy.org/restricted"
    },
    {
        "label": "Markdown Code Inline",
        "obfuscated": "`https://example.com/hidden`",
        "expected": "https://example.com/hidden"
    },
    {
        "label": "Zero-Width Space (U+200B) Injection",
        "obfuscated": "h\u200Bt\u200Bt\u200Bp\u200Bs://example.com",
        "expected": "https://example.com"
    },
    {
        "label": "Zero-Width Non-Joiner (U+200C) in Domain",
        "obfuscated": "https://ex\u200cample.com",
        "expected": "https://example.com"
    },
    {
        "label": "Word Joiner (U+2060) Bypass",
        "obfuscated": "https://test\u2060project.io/join",
        "expected": "https://testproject.io/join"
    },
    {
        "label": "Cyrillic Homoglyph 'а' (U+0430)",
        "obfuscated": "https://ex\u0430mple.com",
        "expected": "https://example.com"
    },
    {
        "label": "Cyrillic Homoglyph 'с' (U+0441)",
        "obfuscated": "https://example.\u0441om",
        "expected": "https://example.com"
    },
    {
        "label": "Greek Homoglyph 'ε' (U+03B5)",
        "obfuscated": "https://\u03b5xample.com",
        "expected": "https://example.com"
    },
    {
        "label": "Extra Slashes Bypass",
        "obfuscated": "https://////example.com/resource",
        "expected": "https://example.com/resource"
    },
    {
        "label": "Malformed Colon/Slash Strategy",
        "obfuscated": "https:://example.com/test",
        "expected": "https://example.com/test"
    },
    {
        "label": "Multi-Separator Chaos",
        "obfuscated": "http:///:::dummy.org/path",
        "expected": "http://dummy.org/path"
    },
    {
        "label": "Mixed: Spaces + Markdown",
        "obfuscated": "**h t t p s** : / / e x a m p l e . c o m",
        "expected": "https://example.com"
    },
    {
        "label": "Mixed: Line Breaks + Zero Width",
        "obfuscated": "h\n\u200Bt\ntps://ex\u200bam\nple.com",
        "expected": "https://example.com"
    },
    {
        "label": "Mixed: Homoglyph + Zero Width Joiner",
        "obfuscated": "https://ex\u200d\u0430mple.com/bypass",
        "expected": "https://example.com/bypass"
    }
];

function runTests() {
    let passed = 0;
    let failed = 0;
    console.log(`${'Label'.padEnd(40)} | ${'Status'.padEnd(10)}`);
    console.log("-".repeat(55));
    
    testCases.forEach(case_ => {
        const actual = normalizeLink(case_.obfuscated);
        const status = actual === case_.expected ? "PASSED" : "FAILED";
        console.log(`${case_.label.padEnd(40)} | ${status.padEnd(10)}`);
        if (status === "FAILED") {
            console.log(`   Expected: ${case_.expected}`);
            console.log(`   Actual:   ${actual}`);
            failed++;
        } else {
            passed++;
        }
    });
    
    console.log("-".repeat(55));
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
}

if (require.main === module) {
    runTests();
}
