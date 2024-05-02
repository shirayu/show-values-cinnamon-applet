const Applet = imports.ui.applet;
const Mainloop = imports.mainloop;
const Soup = imports.gi.Soup;
global.log(
  `Soup: ${Soup.MAJOR_VERSION}.${Soup.MINOR_VERSION}.${Soup.MICRO_VERSION}`,
);

function MyApplet(orientation, panel_height, instance_id) {
  this._init(orientation, panel_height, instance_id);
}

MyApplet.prototype = {
  __proto__: Applet.TextApplet.prototype,

  _init: function (orientation, panel_height, instance_id) {
    Applet.TextApplet.prototype._init.call(
      this,
      orientation,
      panel_height,
      instance_id,
    );

    this.json = null;
    this.mode = false;
    this.threshold1 = 800;
    this.threshold2 = 900;
    this.updateInterval_display = 300; // 0.3 sec
    this.updateInterval_data = 10000; // 10 sec

    this._applet_tooltip._tooltip.set_style("text-align:left");
    this._display();
    this._httpSession = new Soup.Session();
    this._updateData();
  },

  _updateData: function () {
    const url = "http://localhost:5605";
    global.log(imports.gi.GLib.Uri.parse(url));
    const message = Soup.Message.new("GET", url);
    global.log(message.get_method(), message.get_uri());
    const result = this._httpSession.send_and_read(message, null);

    global.log(result); // FIXME
    global.log(JSON.stringify(result)); // FIXME
  },

  _display: function () {
    try {
      if (this.json !== null) {
        const ppm = this.json.stat.co2ppm;
        const label = `${ppm} ppm`;
        if (ppm < this.threshold1) {
          this.set_applet_label(label);
        } else {
          if (this.mode) {
            let icon = "⚠️";
            if (ppm > this.threshold2) {
              icon = "❌";
            }
            this.set_applet_label(`${icon}${label}`);
          } else {
            this.set_applet_label(`${label}`);
          }
          this.mode = !this.mode;
        }
        const lastd = new Date(this.json.time * 1000);
        const tf =
          "Last modified: " +
          lastd.toLocaleDateString() +
          " " +
          lastd.toLocaleTimeString();
        this.set_applet_tooltip(
          tf + "\n\n" + JSON.stringify(this.json.stat, null, "\t"),
        );
      }
    } catch (e) {}

    Mainloop.timeout_add(this.updateInterval_display, this._display.bind(this));
  },

  _onData: function (session, message) {
    try {
      if (message.status_code == Soup.Status.OK) {
        this.json = JSON.parse(message.response_body.data);
      }
    } catch (e) {}

    Mainloop.timeout_add(this.updateInterval_data, this._updateData.bind(this));
  },
};

function main(metadata, orientation, panel_height, instance_id) {
  return new MyApplet(orientation, panel_height, instance_id);
}
