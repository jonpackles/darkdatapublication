/* global Vue */
var app = new Vue({
  el: "#container",
  data() {
    return {
      graphTitle: "Cookies",
      svgHeight: window.innerHeight * 0.825,
      margin: { top: 25, left: 130, bottom: 25, right: 25 },
      cookies: [{}],
      showLabel: false,
      showLabelAuto: false,
      showHoverTip: false,
      links: {
        txtImg: "./assets/images/cookietxt.png",
        everOne: "./assets/images/everlane.png",
        everTwo: "./assets/images/everlane2.png",
        everThree: "./assets/images/everlane3.png",
        everFour: "./assets/images/everlane4.png",
        consent: "./assets/images/consent.png"
      },
      activeLink: null,
      iSelected: null,
      activeIndex: 0,
      domainSelected: null,
      fixedTip: false,
      special: false,
      myCount: null,
      nested_data: [{}],
      domainX: {
        min: 0,
        max: 65
      },
      filterKey: "3rd Party",
      setShown: 0,
      xAxisLabel: "Number of Cookies Stored"
    };
  },
  computed: {
    filteredData() {
      let filteredData = this.nested_data.filter(
        el =>
          el.key !== this.filterKey &&
          el.key !== "" &&
          el.key !== "Various" &&
          el.key !== "Technical"
      );
      return filteredData;
    },
    svgWidth() {
      if (window.innerWidth < 926) {
        return window.innerWidth * 0.9;
      } else {
        return window.innerWidth * 0.55;
      }
    },
    width() {
      return this.svgWidth - this.margin.left - this.margin.right;
    },
    height() {
      return this.svgHeight - this.margin.top - this.margin.bottom;
    },
    scale() {
      // console.log(this.cookies);
      const x = d3
        .scaleLinear()
        // .domain([0, Math.max(...this.nested_data.map(x => x.values.length))])
        .domain([0, this.domainX.max])
        .rangeRound([0, this.width]);

      const y = d3
        .scaleBand()
        // .domain(
        //   this.setShown != 4
        //     ? this.filteredData.map(y => y.key)
        //     : this.cookies.map(y => y.site)
        // )
        .domain(this.filteredData.map(y => y.key))
        // https://github.com/d3/d3-scale/blob/master/README.md#band_rangeRound
        .rangeRound([0, this.height])
        .padding(0.6);

      // const grid = d3
      //   .scaleLinear()
      //   .domain([0, this.domainX.max])
      //   .rangeRound([0, this.width]);

      const gridlines = d3
        .scaleLinear()
        .domain([0, this.domainX.max])
        .rangeRound([0, this.width]);

      return { x, y, gridlines };
    },
    cookieQuery() {
      return `https://cookiepedia.co.uk/cookies/${
        this.cookies[this.activeIndex].name
      }`;
    }
  },
  created() {
    this.loadData();
  },
  mounted() {
    this.initTooltip();
    this.scrollTrigger();
  },
  updated() {
    // console.log(this.cookies);
  },
  methods: {
    loadData() {
      // d3.json("data/data.json").then(d => {
      //   return (this.data = d.cookies);
      // });

      d3.csv("data/cookies.csv", d => {
        return {
          id: +d["cookieID"],
          party: d["party"],
          domain: d["mastername2"],
          thirdpartydom: d["ThirdPartyHost"],
          cat: d["Category"],
          site: d["site"],
          exp: +d["exp"],
          type: d["type"],
          purpose: d["purpose"],
          name: d["name"]
        };
      })
        .then(d => {
          // add property for converted expiration time to days
          let convertedData = d
            .filter(d => d.domain != "Mozilla")
            .map(d => ({
              ...d,
              days: this.timeConvert(d.exp)
            }));
          return (this.cookies = convertedData);
        })
        .then(() => {
          this.nested_data = d3
            .nest()
            .key(d => {
              return d.party;
            })
            .entries(this.cookies);
          this.sort();
        });
    },
    sort() {
      return this.nested_data.forEach(el => {
        el.values.sort((x, y) => {
          return d3.descending(x.cat, y.cat);
        });
      });
    },
    timeConvert(e) {
      // used to convert unix seconds to number of days until expiration
      let cookiesSeconds = e;
      let start = new Date(0); // The 0 there is the key, which sets the date to the epoch
      let updatedD = start.setUTCSeconds(cookiesSeconds);
      // april 14 (need to subtract 1 since data was collected april 13)
      let today = 1555277525106;
      // let today = Date.now();
      let difference = Math.round((updatedD - today) / 86400000) + 1;

      return difference;
    },
    select(id) {
      this.iSelected = id;
      // this.domainSelected = d;
    },
    initTooltip() {
      let self = this;
      tooltip = {
        element: null,
        init: function() {
          this.element = d3
            .select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
        },
        show: function(t) {
          this.element
            .html(t)
            .transition()
            .duration(200)
            .style(
              "left",
              `${self.fixedTip ? window.innerWidth * 0.35 : event.x + 30}px`
            )
            .style(
              "top",
              `${self.fixedTip ? window.innerHeight * 0.5 : event.y + 10}px`
            )
            .style("opacity", 0.925);
        },
        move: function() {
          this.element
            .transition()
            .duration(30)
            .style(
              "left",
              `${self.fixedTip ? window.innerWidth * 0.35 : event.x + 30}px`
            )
            .style(
              "top",
              `${self.fixedTip ? window.innerHeight * 0.5 : event.y + 10}px`
            )
            .style("opacity", 0.925);
        },
        hide: function() {
          this.element
            .transition()
            .duration(100)
            .style("opacity", 0);
          // .delay(100);
          // .style("right", `0px`);
        }
      };
      tooltip.init();
    },
    myTooltip(d) {
      // console.log(d);
      if (this.showLabel || this.showLabelAuto) {
        tooltip.show(`<div id="tip-band"></div><h5 class="total">${
          d.domain
        }</h5><p>
        <span class="datum"><i>"${
          d.name
        }"</i></span> is a <span class="datum">${d.party.toLowerCase()} ${
          d.type
        }</span> cookie that will be stored on my computer for <span class="datum">${
          d.type == "session"
            ? "the length of my browser session"
            : this.timeConvert(d.exp) == 0
            ? "less than one day"
            : this.numFormater(this.timeConvert(d.exp)) + " days"
        }</span>.
        </p>`);
        document.documentElement.style.setProperty(
          "--active-tip",
          this.myFill(d.cat)
        );
      } else if (!this.showLabel) {
        tooltip.hide();
      }
    },
    hoverTip(x) {
      this.activeLink = x;
      if (this.showHoverTip) {
        tooltip.show(
          `<img src="${this.links[this.activeLink]}" width="100%"/>`
        );
      } else if (!this.showHoverTip) {
        tooltip.hide();
      }
    },
    myFill(e) {
      if (e === "News") {
        return "var(--cat-news)";
      } else if (e === "Social") {
        return "var(--cat-social)";
      } else if (e === "Google") {
        return "var(--cat-google)";
      } else if (e === "Shopping") {
        return "var(--cat-ecommerce)";
      } else if (e === "Entertainment") {
        return "var(--cat-ent)";
      }
      if (e === "targeting") {
        return "var(--targeting)";
      } else {
        return "var(--cat-unknown)";
      }
    },
    count() {
      return this.cookies.length;
    },
    numFormater(el) {
      const numFormatT = d3.format(",d");
      return numFormatT(el);
    },
    randomID() {
      // trigger tooltip with random FIRST PARTY cookie
      // pick random cookie from 472 options (first party amount)
      const randomPick = Math.floor(Math.random() * 473);

      // first party only, id of randomPick
      const activeValue = this.cookies
        .filter(x => x.party === "First Party")
        .map(e => e.id)[randomPick];

      // find index of randomly selected cookie id
      this.activeIndex = this.cookies.map(e => e.id).indexOf(activeValue);
      // use activeIndex to sect active index, show label, and fire tooltip method
      this.select(activeValue);
      this.showLabelAuto = true;
      this.myTooltip(this.cookies[this.activeIndex]);
    },
    scrollTrigger() {
      d3.graphScroll()
        .offset(130)
        .graph(d3.selectAll("#graph"))
        .container(d3.select("#chart"))
        .sections(d3.selectAll("#sections > div"))
        .eventId("uniqueId1")
        .on("active", i => {
          console.log("case", i);
          switch (i) {
            case 0:
              this.graphTitle = "Cookies by Party";
              // set shown 0
              this.setShown = 0;
              // set nesting for party type
              this.nested_data = d3
                .nest()
                .key(d => {
                  return d.party;
                })
                .entries(this.cookies);
              this.sort();

              // this.filterKey = "3rd Party";
              this.domainX.max = 700;
              // reset active point
              this.select(null);
              this.showLabelAuto = false;
              this.myTooltip(null);

              break;

            case 1:
              this.graphTitle = "First-Party Cookies by Category";
              // set shown 2
              this.setShown = 2;
              this.nested_data = d3
                .nest()
                .key(d => {
                  return d.cat;
                })
                .entries(this.cookies);

              // this.nested_data = this.nested_data.filter(el => {
              //   el.key != "";
              // });

              // this.nested_data
              this.sort();

              // only first parties max domain
              this.domainX.max = 250;
              // remove third parties
              this.filterKey = "3rd Party";
              // reset active point
              this.select(null);
              this.showLabelAuto = false;
              this.myTooltip(null);
              break;
            case 2:
              this.graphTitle = "First-Party Cookies by Website";
              // set shown 1
              this.setShown = 1;
              // set nesting for domain
              this.nested_data = d3
                .nest()
                .key(d => {
                  return d.domain;
                })
                .entries(this.cookies);

              // only first parties max domain
              this.domainX.max = 70;
              // remove third parties
              this.filterKey = "3rd Party";
              // reset active point
              this.select(null);
              this.showLabelAuto = false;
              this.myTooltip(null);
              this.fixedTip = false;

              break;
            case 3:
              this.graphTitle = "First-Party Cookies by Website";
              // set shown 1
              this.setShown = 1;
              // presorting for smoother animation in next case
              this.sort();

              this.domainX.max = 70;
              this.filterKey = "3rd Party";

              this.fixedTip = true;
              this.randomID();

              break;
            case 4:
              this.graphTitle = "All Cookies by Website";
              // set shown 1
              this.setShown = 1;
              // set nesting for domain
              this.nested_data = d3
                .nest()
                .key(d => {
                  return d.domain;
                })
                .entries(this.cookies);
              this.sort();
              // show third parties
              this.filterKey = null;
              this.domainX.max = 700;
              // reset and hide tooltip
              this.select(null);
              this.showLabelAuto = false;
              this.myTooltip(null);
              this.fixedTip = false;

              break;

            case 5:
              this.graphTitle = "Cookies by Type";
              this.xAxisLabel = "Number of Cookies Stored";

              // set shown 3
              this.setShown = 3;
              // show third parties
              this.filterKey = null;
              this.domainX.max = 1200;
              // set nesting for domain
              this.nested_data = d3
                .nest()
                .key(d => {
                  return d.type;
                })
                .entries(this.cookies);
              this.sort();
              break;
            case 6:
              this.graphTitle = "Persistent Cookies by Expiration";
              this.xAxisLabel = "Days Stored on Computer";
              // set shown 4
              this.domainX.max = 40000;

              this.setShown = 4;

              this.nested_data = d3
                .nest()
                .key(d => {
                  return d.domain;
                })
                .entries(this.cookies);
              this.sort();

              break;
            default:
              console.log(
                "hi im the default case...something didn't fire correctly"
              );
              this.showLabelAuto = false;
              this.myTooltip(null);

              break;
          }
        });
    }
  },
  directives: {
    axis(el, binding) {
      const axis = binding.arg; // x or y

      const axisMethod = { x: "axisTop", y: "axisLeft" }[axis];
      // The line below assigns the x or y function of the scale object
      const methodArg = binding.value[axis];

      // d3.axisBottom(scale.x)
      d3.select(el).call(d3[axisMethod](methodArg).ticks(5));
    },
    grid(el, binding) {
      const axis = binding.arg; // x or y
      const axisMethod = { gridlines: "axisTop" }[axis];
      // The line below assigns the x or y function of the scale object
      const methodArg = binding.value[axis];
      // d3.axisBottom(scale.x)
      d3.select(el).call(
        d3[axisMethod](methodArg)
          .tickFormat("")
          .tickSize(-window.innerHeight * 0.74)
          .ticks(5)
      );
    }
  }
});
