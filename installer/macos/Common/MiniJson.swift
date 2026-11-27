import Foundation

enum JsonValue {
    case null
    case bool(Bool)
    case int(Int64)
    case double(Double)
    case string(String)
    case array([JsonValue])
    case object([String: JsonValue])

    var stringValue: String? {
        if case .string(let s) = self { return s }
        return nil
    }

    var boolValue: Bool? {
        if case .bool(let b) = self { return b }
        return nil
    }

    var intValue: Int? {
        switch self {
        case .int(let n): return Int(exactly: n)
        case .double(let d): return d.isFinite ? Int(exactly: d) : nil
        default: return nil
        }
    }

    var int64Value: Int64? {
        switch self {
        case .int(let n): return n
        case .double(let d): return d.isFinite ? Int64(exactly: d) : nil
        default: return nil
        }
    }

    var arrayValue: [JsonValue]? {
        if case .array(let a) = self { return a }
        return nil
    }

    var objectValue: [String: JsonValue]? {
        if case .object(let o) = self { return o }
        return nil
    }
}

struct MiniJsonError: Error, LocalizedError {
    let message: String
    var errorDescription: String? { return message }
}

enum MiniJson {
    static func parse(_ json: String) throws -> JsonValue {
        let scalars = Array(json.unicodeScalars)
        var idx = 0
        if idx < scalars.count && scalars[idx].value == 0xFEFF {
            idx += 1
        }
        let val = try parseValue(scalars, &idx)
        skipWhitespace(scalars, &idx)
        if idx != scalars.count {
            throw MiniJsonError(message: "Unexpected trailing character at index \(idx)")
        }
        return val
    }

    static func parseObject(_ json: String) throws -> [String: JsonValue] {
        let val = try parse(json)
        guard case .object(let dict) = val else {
            throw MiniJsonError(message: "Expected JSON object")
        }
        return dict
    }

    static func parseArray(_ json: String) throws -> [JsonValue] {
        let val = try parse(json)
        guard case .array(let arr) = val else {
            throw MiniJsonError(message: "Expected JSON array")
        }
        return arr
    }

    static func stringify(_ value: JsonValue, pretty: Bool = false) -> String {
        var out = ""
        out.reserveCapacity(256)
        writeValue(&out, value, pretty: pretty, depth: 0)
        return out
    }

    static func stringifyString(_ s: String) -> String {
        var out = ""
        out.reserveCapacity(s.count + 16)
        writeString(&out, s)
        return out
    }

    private static func skipWhitespace(_ s: [UnicodeScalar], _ idx: inout Int) {
        while idx < s.count {
            let v = s[idx].value
            if v == 0x20 || v == 0x09 || v == 0x0D || v == 0x0A {
                idx += 1
            } else {
                break
            }
        }
    }

    private static func parseValue(_ s: [UnicodeScalar], _ idx: inout Int) throws -> JsonValue {
        skipWhitespace(s, &idx)
        guard idx < s.count else {
            throw MiniJsonError(message: "Unexpected end of JSON")
        }
        let c = s[idx]
        switch c {
        case "{": return .object(try parseObjectInternal(s, &idx))
        case "[": return .array(try parseArrayInternal(s, &idx))
        case "\"": return .string(try parseString(s, &idx))
        case "t":
            try expectLiteral(s, &idx, "true")
            return .bool(true)
        case "f":
            try expectLiteral(s, &idx, "false")
            return .bool(false)
        case "n":
            try expectLiteral(s, &idx, "null")
            return .null
        case "-", "0"..."9":
            return try parseNumber(s, &idx)
        default:
            throw MiniJsonError(message: "Unexpected character '\(c)' at index \(idx)")
        }
    }

    private static func expectLiteral(_ s: [UnicodeScalar], _ idx: inout Int, _ lit: String) throws {
        let litScalars = Array(lit.unicodeScalars)
        guard idx + litScalars.count <= s.count else {
            throw MiniJsonError(message: "Expected '\(lit)' at index \(idx)")
        }
        for i in 0..<litScalars.count {
            if s[idx + i] != litScalars[i] {
                throw MiniJsonError(message: "Expected '\(lit)' at index \(idx)")
            }
        }
        idx += litScalars.count
    }

    private static func parseObjectInternal(_ s: [UnicodeScalar], _ idx: inout Int) throws -> [String: JsonValue] {
        idx += 1 // '{'
        var dict: [String: JsonValue] = [:]
        skipWhitespace(s, &idx)
        if idx < s.count && s[idx] == "}" {
            idx += 1
            return dict
        }
        while true {
            skipWhitespace(s, &idx)
            guard idx < s.count && s[idx] == "\"" else {
                throw MiniJsonError(message: "Expected string key at index \(idx)")
            }
            let key = try parseString(s, &idx)
            skipWhitespace(s, &idx)
            guard idx < s.count && s[idx] == ":" else {
                throw MiniJsonError(message: "Expected ':' at index \(idx)")
            }
            idx += 1
            let val = try parseValue(s, &idx)
            dict[key] = val
            skipWhitespace(s, &idx)
            guard idx < s.count else {
                throw MiniJsonError(message: "Unterminated JSON object")
            }
            if s[idx] == "}" {
                idx += 1
                return dict
            }
            if s[idx] != "," {
                throw MiniJsonError(message: "Expected ',' or '}' at index \(idx)")
            }
            idx += 1
        }
    }

    private static func parseArrayInternal(_ s: [UnicodeScalar], _ idx: inout Int) throws -> [JsonValue] {
        idx += 1 // '['
        var arr: [JsonValue] = []
        skipWhitespace(s, &idx)
        if idx < s.count && s[idx] == "]" {
            idx += 1
            return arr
        }
        while true {
            let val = try parseValue(s, &idx)
            arr.append(val)
            skipWhitespace(s, &idx)
            guard idx < s.count else {
                throw MiniJsonError(message: "Unterminated JSON array")
            }
            if s[idx] == "]" {
                idx += 1
                return arr
            }
            if s[idx] != "," {
                throw MiniJsonError(message: "Expected ',' or ']' at index \(idx)")
            }
            idx += 1
        }
    }

    private static func parseHex4(_ s: [UnicodeScalar], _ idx: inout Int) throws -> UInt32 {
        guard idx + 4 <= s.count else {
            throw MiniJsonError(message: "Invalid unicode escape at index \(idx)")
        }
        var hex = ""
        hex.reserveCapacity(4)
        for i in 0..<4 {
            hex.unicodeScalars.append(s[idx + i])
        }
        guard let code = UInt32(hex, radix: 16) else {
            throw MiniJsonError(message: "Invalid hex unicode escape '\\u\(hex)'")
        }
        idx += 4
        return code
    }

    private static func parseString(_ s: [UnicodeScalar], _ idx: inout Int) throws -> String {
        idx += 1 // '"'
        var out = ""
        while idx < s.count {
            let c = s[idx]
            idx += 1
            if c == "\"" {
                return out
            }
            if c == "\\" {
                guard idx < s.count else {
                    throw MiniJsonError(message: "Unterminated escape sequence")
                }
                let esc = s[idx]
                idx += 1
                switch esc {
                case "\"": out.append("\"")
                case "\\": out.append("\\")
                case "/": out.append("/")
                case "b": out.append("\u{0008}")
                case "f": out.append("\u{000C}")
                case "n": out.append("\n")
                case "r": out.append("\r")
                case "t": out.append("\t")
                case "u":
                    let code = try parseHex4(s, &idx)
                    if code >= 0xD800 && code <= 0xDBFF {
                        // High surrogate: look for paired low surrogate
                        if idx + 2 <= s.count && s[idx] == "\\" && s[idx + 1] == "u" {
                            let savedIdx = idx
                            idx += 2
                            let low = try parseHex4(s, &idx)
                            if low >= 0xDC00 && low <= 0xDFFF {
                                let combined = 0x10000 + ((code - 0xD800) << 10) + (low - 0xDC00)
                                if let scalar = UnicodeScalar(combined) {
                                    out.unicodeScalars.append(scalar)
                                    continue
                                }
                            }
                            idx = savedIdx
                        }
                    }
                    if let scalar = UnicodeScalar(code) {
                        out.unicodeScalars.append(scalar)
                    } else {
                        out.unicodeScalars.append(UnicodeScalar(0xFFFD)!)
                    }
                default:
                    throw MiniJsonError(message: "Invalid escape '\\\(esc)'")
                }
            } else {
                out.unicodeScalars.append(c)
            }
        }
        throw MiniJsonError(message: "Unterminated JSON string")
    }

    private static func parseNumber(_ s: [UnicodeScalar], _ idx: inout Int) throws -> JsonValue {
        let start = idx
        var isFloat = false
        if s[idx] == "-" { idx += 1 }
        while idx < s.count && s[idx].value >= 48 && s[idx].value <= 57 { idx += 1 }
        if idx < s.count && s[idx] == "." {
            isFloat = true
            idx += 1
            while idx < s.count && s[idx].value >= 48 && s[idx].value <= 57 { idx += 1 }
        }
        if idx < s.count && (s[idx] == "e" || s[idx] == "E") {
            isFloat = true
            idx += 1
            if idx < s.count && (s[idx] == "+" || s[idx] == "-") { idx += 1 }
            while idx < s.count && s[idx].value >= 48 && s[idx].value <= 57 { idx += 1 }
        }
        var raw = ""
        for i in start..<idx {
            raw.unicodeScalars.append(s[i])
        }
        if !isFloat, let iv = Int64(raw) {
            return .int(iv)
        }
        if let dv = Double(raw), dv.isFinite {
            return .double(dv)
        }
        throw MiniJsonError(message: "Invalid JSON number: \(raw)")
    }

    private static func writeValue(_ out: inout String, _ value: JsonValue, pretty: Bool, depth: Int) {
        switch value {
        case .null:
            out.append("null")
        case .bool(let b):
            out.append(b ? "true" : "false")
        case .int(let n):
            out.append(String(n))
        case .double(let d):
            if d.isFinite {
                out.append(String(d))
            } else {
                out.append("null")
            }
        case .string(let s):
            writeString(&out, s)
        case .array(let arr):
            writeArray(&out, arr, pretty: pretty, depth: depth)
        case .object(let dict):
            writeObject(&out, dict, pretty: pretty, depth: depth)
        }
    }

    private static func writeObject(_ out: inout String, _ dict: [String: JsonValue], pretty: Bool, depth: Int) {
        out.append("{")
        let keys = dict.keys.sorted()
        for (i, k) in keys.enumerated() {
            if i > 0 { out.append(",") }
            if pretty {
                out.append("\n")
                out.append(String(repeating: " ", count: (depth + 1) * 2))
            }
            writeString(&out, k)
            out.append(pretty ? ": " : ":")
            writeValue(&out, dict[k] ?? .null, pretty: pretty, depth: depth + 1)
        }
        if !keys.isEmpty && pretty {
            out.append("\n")
            out.append(String(repeating: " ", count: depth * 2))
        }
        out.append("}")
    }

    private static func writeArray(_ out: inout String, _ arr: [JsonValue], pretty: Bool, depth: Int) {
        out.append("[")
        for (i, item) in arr.enumerated() {
            if i > 0 { out.append(",") }
            if pretty {
                out.append("\n")
                out.append(String(repeating: " ", count: (depth + 1) * 2))
            }
            writeValue(&out, item, pretty: pretty, depth: depth + 1)
        }
        if !arr.isEmpty && pretty {
            out.append("\n")
            out.append(String(repeating: " ", count: depth * 2))
        }
        out.append("]")
    }

    private static func writeString(_ out: inout String, _ s: String) {
        out.append("\"")
        for scalar in s.unicodeScalars {
            switch scalar.value {
            case 0x22: out.append("\\\"")
            case 0x5C: out.append("\\\\")
            case 0x08: out.append("\\b")
            case 0x0C: out.append("\\f")
            case 0x0A: out.append("\\n")
            case 0x0D: out.append("\\r")
            case 0x09: out.append("\\t")
            case 0x2028: out.append("\\u2028")
            case 0x2029: out.append("\\u2029")
            case 0x00..<0x20:
                let hex = String(scalar.value, radix: 16, uppercase: false)
                out.append("\\u")
                if hex.count < 4 {
                    out.append(String(repeating: "0", count: 4 - hex.count))
                }
                out.append(hex)
            default:
                out.unicodeScalars.append(scalar)
            }
        }
        out.append("\"")
    }
}
