export default class AnsiUp {
    VERSION: string;
    private ansi_colors;
    private palette_256;
    private fg;
    private bg;
    private bold;
    private italic;
    private underline;
    private _use_classes;
    private _csi_regex;
    private _osc_st;
    private _osc_regex;
    private _url_whitelist;
    private _buffer;
    constructor();
    set use_classes(arg: boolean);
    get use_classes(): boolean;
    set url_whitelist(arg: {});
    get url_whitelist(): {};
    private setup_palettes;
    private escape_txt_for_html;
    private append_buffer;
    private get_next_packet;
    ansi_to_html(txt: string): string;
    resetStyles(): void;
    private with_state;
    private process_ansi;
    private transform_to_html;
    private process_hyperlink;
}
//# sourceMappingURL=ansi_up.d.ts.map