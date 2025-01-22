const Applet = imports.ui.applet;
const Mainloop = imports.mainloop;
const Soup = imports.gi.Soup;
global.log(`Soup: ${Soup.MAJOR_VERSION}.${Soup.MINOR_VERSION}.${Soup.MICRO_VERSION}`);

function MyApplet(orientation, panel_height, instance_id) {
  this._init(orientation, panel_height, instance_id);
}

MyApplet.prototype = {
  __proto__: Applet.TextApplet.prototype,

  _init: function (orientation, panel_height, instance_id) {
    Applet.TextApplet.prototype._init.call(this, orientation, panel_height, instance_id);

    this._updateDataTimeout = null;
    this._displayTimeout = null;

    this.json = null;
    this.mode = false;
    this.threshold1 = 800;
    this.threshold2 = 900;
    this.updateInterval_display = 1000; // 1.0 sec
    this.updateInterval_data = 10000; // 10 sec

    this._applet_tooltip._tooltip.set_style("text-align:left");
    this._display();
    this._httpSession = new Soup.Session();
    this._updateData();
  },

  _updateData: function () {
    try {
      const url = "http://localhost:5605";
      const message = Soup.Message.new("GET", url);
      const bytes = this._httpSession.send_and_read(message, null);
      if (bytes === null) {
        this.set_applet_tooltip(`Failed to load data: ${url}`);
      } else {
        const decoder = new TextDecoder("utf-8");
        const result = decoder.decode(bytes.get_data());
        this.json = JSON.parse(result);
      }
      if (this._updateDataTimeout) {
        Mainloop.source_remove(this._updateDataTimeout);
      }
    } catch (e) {
      this.set_applet_tooltip(`Error: ${e.message}`);
      this.json = null;
    }

    this._updateDataTimeout = Mainloop.timeout_add(this.updateInterval_data, this._updateData.bind(this));
  },

  _display: function () {
    try {
      if (this.json === null) {
        this.set_applet_label("No data");
      } else {
        const ppm = this.json.stat.co2ppm;
        const humidity = Math.trunc(this.json.stat.humidity);
        const temperature = this.json.stat.temperature;
        const label = `${ppm} ppm, ${humidity}%, ${temperature}℃`;
        let icon = "";
        if (ppm >= this.threshold1) {
          this.updateInterval_display = 300; // 0.3 sec
          if (ppm > this.threshold2) {
            if (this.mode) {
              icon = "❌";
            } else {
              icon = "";
            }
          } else {
            if (this.mode) {
              icon = "🟧";
            } else {
              icon = "";
            }
          }
          this.mode = !this.mode;
        } else {
          this.updateInterval_display = 1000; // 1.0 sec
          if (this.mode) {
            icon = ".";
          } else {
            icon = " ";
          }
          this.mode = !this.mode;
        }
        this.set_applet_label(`${icon}${label}`);
        const lastd = new Date(this.json.time * 1000);
        const tf = "Last modified: " + lastd.toLocaleDateString() + " " + lastd.toLocaleTimeString();
        this.set_applet_tooltip(tf + "\n\n" + JSON.stringify(this.json.stat, null, "\t"));
      }
    } catch (e) {
      global.logError(`Error in _display: ${e.message}`);
    }

    if (this._displayTimeout) {
      Mainloop.source_remove(this._displayTimeout);
    }
    this._displayTimeout = Mainloop.timeout_add(this.updateInterval_display, this._display.bind(this));
  },
};

function main(metadata, orientation, panel_height, instance_id) {
  return new MyApplet(orientation, panel_height, instance_id);
}
