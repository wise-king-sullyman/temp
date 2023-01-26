/* ansi_up.js
 * author : Dru Nelson
 * license : MIT
 * http://github.com/drudru/ansi_up
 */
// Used internally when breaking up the raw text into packets
var PacketKind;
(function (PacketKind) {
    PacketKind[PacketKind["EOS"] = 0] = "EOS";
    PacketKind[PacketKind["Text"] = 1] = "Text";
    PacketKind[PacketKind["Incomplete"] = 2] = "Incomplete";
    PacketKind[PacketKind["ESC"] = 3] = "ESC";
    PacketKind[PacketKind["Unknown"] = 4] = "Unknown";
    PacketKind[PacketKind["SGR"] = 5] = "SGR";
    PacketKind[PacketKind["OSCURL"] = 6] = "OSCURL"; // Operating System Command
})(PacketKind || (PacketKind = {}));
//
// MAIN CLASS
//
export default class AnsiUp {
    constructor() {
        this.VERSION = '5.0.1';
        this._url_whitelist = {};
        // All construction occurs here
        this.setup_palettes();
        this.resetStyles();
    }
    set use_classes(arg) {
        this._use_classes = arg;
    }
    get use_classes() {
        return this._use_classes;
    }
    set url_whitelist(arg) {
        this._url_whitelist = arg;
    }
    get url_whitelist() {
        return this._url_whitelist;
    }
    setup_palettes() {
        this.ansi_colors = [
            // Normal colors
            [
                { rgb: [0, 0, 0], class_name: 'ansi-black' },
                { rgb: [187, 0, 0], class_name: 'ansi-red' },
                { rgb: [0, 187, 0], class_name: 'ansi-green' },
                { rgb: [187, 187, 0], class_name: 'ansi-yellow' },
                { rgb: [0, 0, 187], class_name: 'ansi-blue' },
                { rgb: [187, 0, 187], class_name: 'ansi-magenta' },
                { rgb: [0, 187, 187], class_name: 'ansi-cyan' },
                { rgb: [255, 255, 255], class_name: 'ansi-white' }
            ],
            // Bright colors
            [
                { rgb: [85, 85, 85], class_name: 'ansi-bright-black' },
                { rgb: [255, 85, 85], class_name: 'ansi-bright-red' },
                { rgb: [0, 255, 0], class_name: 'ansi-bright-green' },
                { rgb: [255, 255, 85], class_name: 'ansi-bright-yellow' },
                { rgb: [85, 85, 255], class_name: 'ansi-bright-blue' },
                { rgb: [255, 85, 255], class_name: 'ansi-bright-magenta' },
                { rgb: [85, 255, 255], class_name: 'ansi-bright-cyan' },
                { rgb: [255, 255, 255], class_name: 'ansi-bright-white' }
            ]
        ];
        this.palette_256 = [];
        // Index 0..15 : Ansi-Colors
        this.ansi_colors.forEach(palette => {
            palette.forEach(rec => {
                this.palette_256.push(rec);
            });
        });
        // Index 16..231 : RGB 6x6x6
        // https://gist.github.com/jasonm23/2868981#file-xterm-256color-yaml
        const levels = [0, 95, 135, 175, 215, 255];
        for (let r = 0; r < 6; ++r) {
            for (let g = 0; g < 6; ++g) {
                for (let b = 0; b < 6; ++b) {
                    const col = { rgb: [levels[r], levels[g], levels[b]], class_name: 'truecolor' };
                    this.palette_256.push(col);
                }
            }
        }
        // Index 232..255 : Grayscale
        let grey_level = 8;
        for (let i = 0; i < 24; ++i, grey_level += 10) {
            const gry = { rgb: [grey_level, grey_level, grey_level], class_name: 'truecolor' };
            this.palette_256.push(gry);
        }
    }
    escape_txt_for_html(txt) {
        return txt.replace(/[&<>"']/gm, str => {
            if (str === '&') {
                return '&amp;';
            }
            if (str === '<') {
                return '&lt;';
            }
            if (str === '>') {
                return '&gt;';
            }
            if (str === '"') {
                return '&quot;';
            }
            if (str === "'") {
                return '&#x27;';
            }
        });
    }
    append_buffer(txt) {
        const str = this._buffer + txt;
        this._buffer = str;
    }
    get_next_packet() {
        const pkt = {
            kind: PacketKind.EOS,
            text: '',
            url: ''
        };
        const len = this._buffer.length;
        if (len == 0) {
            return pkt;
        }
        const pos = this._buffer.indexOf('\x1B');
        // The most common case, no ESC codes
        if (pos == -1) {
            pkt.kind = PacketKind.Text;
            pkt.text = this._buffer;
            this._buffer = '';
            return pkt;
        }
        if (pos > 0) {
            pkt.kind = PacketKind.Text;
            pkt.text = this._buffer.slice(0, pos);
            this._buffer = this._buffer.slice(pos);
            return pkt;
        }
        // NOW WE HANDLE ESCAPES
        if (pos == 0) {
            if (len == 1) {
                // Lone ESC in Buffer, We don't know yet
                pkt.kind = PacketKind.Incomplete;
                return pkt;
            }
            const next_char = this._buffer.charAt(1);
            // We treat this as a single ESC
            // Which effecitvely shows
            if (next_char != '[' && next_char != ']') {
                // DeMorgan
                pkt.kind = PacketKind.ESC;
                pkt.text = this._buffer.slice(0, 1);
                this._buffer = this._buffer.slice(1);
                return pkt;
            }
            // OK is this an SGR or OSC that we handle
            // SGR CHECK
            if (next_char == '[') {
                // We do this regex initialization here so
                // we can keep the regex close to its use (Readability)
                // All ansi codes are typically in the following format.
                // We parse it and focus specifically on the
                // graphics commands (SGR)
                //
                // CONTROL-SEQUENCE-INTRODUCER CSI             (ESC, '[')
                // PRIVATE-MODE-CHAR                           (!, <, >, ?)
                // Numeric parameters separated by semicolons  ('0' - '9', ';')
                // Intermediate-modifiers                      (0x20 - 0x2f)
                // COMMAND-CHAR                                (0x40 - 0x7e)
                //
                if (!this._csi_regex) {
                    this._csi_regex = rgx `
                        ^                           # beginning of line
                                                    #
                                                    # First attempt
                        (?:                         # legal sequence
                          \x1b\[                      # CSI
                          ([\x3c-\x3f]?)              # private-mode char
                          ([\d;]*)                    # any digits or semicolons
                          ([\x20-\x2f]?               # an intermediate modifier
                          [\x40-\x7e])                # the command
                        )
                        |                           # alternate (second attempt)
                        (?:                         # illegal sequence
                          \x1b\[                      # CSI
                          [\x20-\x7e]*                # anything legal
                          ([\x00-\x1f:])              # anything illegal
                        )
                    `;
                }
                const match = this._buffer.match(this._csi_regex);
                // This match is guaranteed to terminate (even on
                // invalid input). The key is to match on legal and
                // illegal sequences.
                // The first alternate matches everything legal and
                // the second matches everything illegal.
                //
                // If it doesn't match, then we have not received
                // either the full sequence or an illegal sequence.
                // If it does match, the presence of field 4 tells
                // us whether it was legal or illegal.
                if (match === null) {
                    pkt.kind = PacketKind.Incomplete;
                    return pkt;
                }
                // match is an array
                // 0 - total match
                // 1 - private mode chars group
                // 2 - digits and semicolons group
                // 3 - command
                // 4 - illegal char
                if (match[4]) {
                    // Illegal sequence, just remove the ESC
                    pkt.kind = PacketKind.ESC;
                    pkt.text = this._buffer.slice(0, 1);
                    this._buffer = this._buffer.slice(1);
                    return pkt;
                }
                // If not a valid SGR, we don't handle
                if (match[1] != '' || match[3] != 'm') {
                    pkt.kind = PacketKind.Unknown;
                }
                else {
                    pkt.kind = PacketKind.SGR;
                }
                pkt.text = match[2]; // Just the parameters
                var rpos = match[0].length;
                this._buffer = this._buffer.slice(rpos);
                return pkt;
            }
            // OSC CHECK
            if (next_char == ']') {
                if (len < 4) {
                    pkt.kind = PacketKind.Incomplete;
                    return pkt;
                }
                if (this._buffer.charAt(2) != '8' || this._buffer.charAt(3) != ';') {
                    // This is not a match, so we'll just treat it as ESC
                    pkt.kind = PacketKind.ESC;
                    pkt.text = this._buffer.slice(0, 1);
                    this._buffer = this._buffer.slice(1);
                    return pkt;
                }
                // We do this regex initialization here so
                // we can keep the regex close to its use (Readability)
                // Matching a Hyperlink OSC with a regex is difficult
                // because Javascript's regex engine doesn't support
                // 'partial match' support.
                //
                // Therefore, we require the system to match the
                // string-terminator(ST) before attempting a match.
                // Once we find it, we attempt the Hyperlink-Begin
                // match.
                // If that goes ok, we scan forward for the next
                // ST.
                // Finally, we try to match it all and return
                // the sequence.
                // Also, it is important to note that we consider
                // certain control characters as an invalidation of
                // the entire sequence.
                // We do regex initializations here so
                // we can keep the regex close to its use (Readability)
                // STRING-TERMINATOR
                // This is likely to terminate in most scenarios
                // because it will terminate on a newline
                if (!this._osc_st) {
                    this._osc_st = rgxG `
                        (?:                         # legal sequence
                          (\x1b\\)                    # ESC \
                          |                           # alternate
                          (\x07)                      # BEL (what xterm did)
                        )
                        |                           # alternate (second attempt)
                        (                           # illegal sequence
                          [\x00-\x06]                 # anything illegal
                          |                           # alternate
                          [\x08-\x1a]                 # anything illegal
                          |                           # alternate
                          [\x1c-\x1f]                 # anything illegal
                        )
                    `;
                }
                // VERY IMPORTANT
                // We do a stateful regex match with exec.
                // If the regex is global, and it used with 'exec',
                // then it will search starting at the 'lastIndex'
                // If it matches, the regex can be used again to
                // find the next match.
                this._osc_st.lastIndex = 0;
                {
                    const match = this._osc_st.exec(this._buffer);
                    if (match === null) {
                        pkt.kind = PacketKind.Incomplete;
                        return pkt;
                    }
                    // If an illegal character was found, bail on the match
                    if (match[3]) {
                        // Illegal sequence, just remove the ESC
                        pkt.kind = PacketKind.ESC;
                        pkt.text = this._buffer.slice(0, 1);
                        this._buffer = this._buffer.slice(1);
                        return pkt;
                    }
                }
                // OK - we might have the prefix and URI
                // Lets start our search for the next ST
                // past this index
                {
                    const match = this._osc_st.exec(this._buffer);
                    if (match === null) {
                        pkt.kind = PacketKind.Incomplete;
                        return pkt;
                    }
                    // If an illegal character was found, bail on the match
                    if (match[3]) {
                        // Illegal sequence, just remove the ESC
                        pkt.kind = PacketKind.ESC;
                        pkt.text = this._buffer.slice(0, 1);
                        this._buffer = this._buffer.slice(1);
                        return pkt;
                    }
                }
                // OK, at this point we should have a FULL match!
                //
                // Lets try to match that now
                if (!this._osc_regex) {
                    this._osc_regex = rgx `
                        ^                           # beginning of line
                                                    #
                        \x1b\]8;                    # OSC Hyperlink
                        [\x20-\x3a\x3c-\x7e]*       # params (excluding ;)
                        ;                           # end of params
                        ([\x21-\x7e]{0,512})        # URL capture
                        (?:                         # ST
                          (?:\x1b\\)                  # ESC \
                          |                           # alternate
                          (?:\x07)                    # BEL (what xterm did)
                        )
                        ([\x20-\x7e]+)              # TEXT capture
                        \x1b\]8;;                   # OSC Hyperlink End
                        (?:                         # ST
                          (?:\x1b\\)                  # ESC \
                          |                           # alternate
                          (?:\x07)                    # BEL (what xterm did)
                        )
                    `;
                }
                const match = this._buffer.match(this._osc_regex);
                if (match === null) {
                    // Illegal sequence, just remove the ESC
                    pkt.kind = PacketKind.ESC;
                    pkt.text = this._buffer.slice(0, 1);
                    this._buffer = this._buffer.slice(1);
                    return pkt;
                }
                // match is an array
                // 0 - total match
                // 1 - URL
                // 2 - Text
                // If a valid SGR
                pkt.kind = PacketKind.OSCURL;
                pkt.url = match[1];
                pkt.text = match[2];
                var rpos = match[0].length;
                this._buffer = this._buffer.slice(rpos);
                return pkt;
            }
        }
    }
    ansi_to_html(txt) {
        this.append_buffer(txt);
        const blocks = [];
        while (true) {
            const packet = this.get_next_packet();
            if (packet.kind == PacketKind.EOS || packet.kind == PacketKind.Incomplete) {
                break;
            }
            // Drop single ESC or Unknown CSI
            if (packet.kind == PacketKind.ESC || packet.kind == PacketKind.Unknown) {
                continue;
            }
            if (packet.kind == PacketKind.Text) {
                blocks.push(this.transform_to_html(this.with_state(packet)));
            }
            else if (packet.kind == PacketKind.SGR) {
                this.process_ansi(packet);
            }
            else if (packet.kind == PacketKind.OSCURL) {
                blocks.push(this.process_hyperlink(packet));
            }
        }
        return blocks.join('');
    }
    resetStyles() {
        this._use_classes = false;
        this.bold = false;
        this.italic = false;
        this.underline = false;
        this.fg = this.bg = null;
        this._buffer = '';
        this._url_whitelist = { http: 1, https: 1 };
    }
    with_state(pkt) {
        return {
            bold: this.bold,
            italic: this.italic,
            underline: this.underline,
            fg: this.fg,
            bg: this.bg,
            text: pkt.text
        };
    }
    process_ansi(pkt) {
        // Ok - we have a valid "SGR" (Select Graphic Rendition)
        const sgr_cmds = pkt.text.split(';');
        // Each of these params affects the SGR state
        // Why do we shift through the array instead of a forEach??
        // ... because some commands consume the params that follow !
        while (sgr_cmds.length > 0) {
            const sgr_cmd_str = sgr_cmds.shift();
            const num = parseInt(sgr_cmd_str, 10);
            if (isNaN(num) || num === 0) {
                this.fg = this.bg = null;
                this.bold = false;
                this.italic = false;
                this.underline = false;
            }
            else if (num === 1) {
                this.bold = true;
            }
            else if (num === 3) {
                this.italic = true;
            }
            else if (num === 4) {
                this.underline = true;
            }
            else if (num === 22) {
                this.bold = false;
            }
            else if (num === 23) {
                this.italic = false;
            }
            else if (num === 24) {
                this.underline = false;
            }
            else if (num === 39) {
                this.fg = null;
            }
            else if (num === 49) {
                this.bg = null;
            }
            else if (num >= 30 && num < 38) {
                this.fg = this.ansi_colors[0][num - 30];
            }
            else if (num >= 40 && num < 48) {
                this.bg = this.ansi_colors[0][num - 40];
            }
            else if (num >= 90 && num < 98) {
                this.fg = this.ansi_colors[1][num - 90];
            }
            else if (num >= 100 && num < 108) {
                this.bg = this.ansi_colors[1][num - 100];
            }
            else if (num === 38 || num === 48) {
                // extended set foreground/background color
                // validate that param exists
                if (sgr_cmds.length > 0) {
                    // extend color (38=fg, 48=bg)
                    const is_foreground = num === 38;
                    const mode_cmd = sgr_cmds.shift();
                    // MODE '5' - 256 color palette
                    if (mode_cmd === '5' && sgr_cmds.length > 0) {
                        const palette_index = parseInt(sgr_cmds.shift(), 10);
                        if (palette_index >= 0 && palette_index <= 255) {
                            if (is_foreground) {
                                this.fg = this.palette_256[palette_index];
                            }
                            else {
                                this.bg = this.palette_256[palette_index];
                            }
                        }
                    }
                    // MODE '2' - True Color
                    if (mode_cmd === '2' && sgr_cmds.length > 2) {
                        const r = parseInt(sgr_cmds.shift(), 10);
                        const g = parseInt(sgr_cmds.shift(), 10);
                        const b = parseInt(sgr_cmds.shift(), 10);
                        if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
                            const c = { rgb: [r, g, b], class_name: 'truecolor' };
                            if (is_foreground) {
                                this.fg = c;
                            }
                            else {
                                this.bg = c;
                            }
                        }
                    }
                }
            }
        }
    }
    transform_to_html(fragment) {
        const txt = fragment.text;
        if (txt.length === 0) {
            return txt;
        }
        // txt = this.escape_txt_for_html(txt);
        // If colors not set, default style is used
        if (!fragment.bold && !fragment.italic && !fragment.underline && fragment.fg === null && fragment.bg === null) {
            return txt;
        }
        const styles = [];
        const classes = [];
        const fg = fragment.fg;
        const bg = fragment.bg;
        // Note on bold: https://stackoverflow.com/questions/6737005/what-are-some-advantages-to-using-span-style-font-weightbold-rather-than-b?rq=1
        if (fragment.bold) {
            styles.push('font-weight:bold');
        }
        if (fragment.italic) {
            styles.push('font-style:italic');
        }
        if (fragment.underline) {
            styles.push('text-decoration:underline');
        }
        if (!this._use_classes) {
            // USE INLINE STYLES
            if (fg) {
                styles.push(`color:rgb(${fg.rgb.join(',')})`);
            }
            if (bg) {
                styles.push(`background-color:rgb(${bg.rgb})`);
            }
        }
        else {
            // USE CLASSES
            if (fg) {
                if (fg.class_name !== 'truecolor') {
                    classes.push(`${fg.class_name}-fg`);
                }
                else {
                    styles.push(`color:rgb(${fg.rgb.join(',')})`);
                }
            }
            if (bg) {
                if (bg.class_name !== 'truecolor') {
                    classes.push(`${bg.class_name}-bg`);
                }
                else {
                    styles.push(`background-color:rgb(${bg.rgb.join(',')})`);
                }
            }
        }
        let class_string = '';
        let style_string = '';
        if (classes.length) {
            class_string = ` class="${classes.join(' ')}"`;
        }
        if (styles.length) {
            style_string = ` style="${styles.join(';')}"`;
        }
        return `<span${style_string}${class_string}>${txt}</span>`;
    }
    process_hyperlink(pkt) {
        // Check URL scheme
        const parts = pkt.url.split(':');
        if (parts.length < 1) {
            return '';
        }
        if (!this._url_whitelist[parts[0]]) {
            return '';
        }
        const result = `<a href="${this.escape_txt_for_html(pkt.url)}">${this.escape_txt_for_html(pkt.text)}</a>`;
        return result;
    }
}
//
// PRIVATE FUNCTIONS
//
// ES5 template string transformer
function rgx(tmplObj, ...subst) {
    // Use the 'raw' value so we don't have to double backslash in a template string
    const regexText = tmplObj.raw[0];
    // Remove white-space and comments
    const wsrgx = /^\s+|\s+\n|\s*#[\s\S]*?\n|\n/gm;
    const txt2 = regexText.replace(wsrgx, '');
    return new RegExp(txt2);
}
// ES5 template string transformer
// Multi-Line On
function rgxG(tmplObj, ...subst) {
    // Use the 'raw' value so we don't have to double backslash in a template string
    const regexText = tmplObj.raw[0];
    // Remove white-space and comments
    const wsrgx = /^\s+|\s+\n|\s*#[\s\S]*?\n|\n/gm;
    const txt2 = regexText.replace(wsrgx, '');
    return new RegExp(txt2, 'g');
}
//# sourceMappingURL=ansi_up.js.map