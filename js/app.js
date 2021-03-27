// This is where the magic happens
// Written by Fredrik August Madsen-Malmo (github@fredrikaugust)

// by default github paginates all responses with 30 items, we can change this by specifying the per-page property
// Also, we need to specify what page we need so we can paginate on the frontend as well.
const perPage = 15;
const page = window.location.href.match(/page=(\d+)/)
  ? window.location.href.match(/page=(\d+)/)[1]
  : 1;

function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

const label = getParameterByName("label");
const navBreadcrumb = document.querySelector(".nav-breadcrumb");

const URL =
  "https://api.github.com/repos/kodekuy/kodekuy.github.io/issues?per_page=" +
  perPage +
  "&page=" +
  page +
  (label ? "&labels=" + encodeURI(label) : "");

const storeData =
  "projects:p:" + page + (label ? ":l:" + encodeURI(label.toLowerCase()) : "");

const ttl = 60 * 60 * 1000;

if (window.location.href.match(/_r;=9/)) {
  localStorage.clear();
}

let progressInt = 0;
var progress = setInterval(() => {
  if (progressInt < 100) {
    progressInt += 1;
  }
  $(".progress-bar").attr({ style: "width: " + progressInt + "%" });
}, 500);

function get_item() {
  const now = new Date();
  let items = localStorage.getItem(storeData);
  items = JSON.parse(items);
  if (items) {
    if (now.getTime() < items.expiry) {
      return {
        items: items.items,
        page: items.page,
      };
    }
  }
  return false;
}

function set_item(value, page) {
  const now = new Date();

  // `item` is an object which contains the original value
  // as well as the time when it's supposed to expire
  const item = {
    items: value,
    page: page,
    expiry: now.getTime() + ttl,
  };

  localStorage.setItem(storeData, JSON.stringify(item));

  value.forEach(function (issue) {
    localStorage.setItem("projects:id:" + issue.number, JSON.stringify(issue));
  });
}

function display_issues() {
  const data = get_item(storeData);
  if (data) {
    show_issues_in_dom(data.items, data.page);
    clear_interval(progress);
    return;
  }

  $.get({
    url: URL,
    success: function (data, status, xhr) {
      // the total number of pages we have in the pagination is gotten from the response header (Link)
      // However, to extract it, this is the simplest hack I could come up with.
      const str = xhr.getResponseHeader("Link");

      // if we can't find rel=last, then this is the last page
      let pages =
        str != null && str.indexOf('rel="last"') > 0
          ? parseInt(str[str.indexOf('rel="last"') - 4])
          : page;

      set_item(data, pages);
      show_issues_in_dom(data, pages);
      clear_interval(progress);
    },
    error: function () {
      clear_interval(progress);
    },
  });
}

function clear_interval(interval) {
  clearInterval(interval);
  $(".progress-bar").attr({ style: "width: 100%" });
  progressInt = 0;
  $(".progress").slideUp();
}

function generate_label_html(labels) {
  let label_string = "";

  labels.forEach(function (label) {
    label_string +=
      "<a href='/index.html?label=" +
      encodeURI(label.name) +
      "'><span class='badge' style='background-color: #" +
      label.color +
      "'>" +
      label.name +
      "</span></a>&nbsp;";
  });

  return label_string;
}

function create_issue_url(issue) {
  return "/detail.html?project-id=" + issue;
  const loc = window.location.href;
  // if the location ends with a slash
  if (loc.slice(-1) == "/") {
    return loc + "detail.html?project-id=" + issue;
  } else if (loc.slice(-1) == "#") {
    return loc.slice(0, -1) + "detail.html?project-id=" + issue;
  } else if (loc.indexOf("?") > 0) {
    // if a url query has been applied, match the last / and replace everything onwards with the issue url
    return (
      loc.replace(/(?:\/[^\/\r\n]*)$/, "/") + "detail.html?project-id=" + issue
    );
  }
  return loc.replace(/\w+\.[^.]+$/, "") + "detail.html?project-id=" + issue;
}

function show_issues_in_dom(issues, pages) {
  issues.forEach(function (issue) {
    $("#projects .row").append(
      `<div class="col-sm-12 col-md-12 col-lg-4">
        <div class="card shadow-sm">
          <div class="card-header bg-blue text-secondary">${issue.title}</div>
          <div class="card-body">
            <div class="blur"></div>
            <p class="card-text">
              ${marked(issue.body)
                .replace("<img", '<img class="responsive-img lazy"')
                .replace('/src="', 'data-src="')
                .replace(/h[1-6]/g, "h5")}
            </p>
          </div>
          <div class="card-footer">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                ${generate_label_html(issue.labels)}
              </div>
              <div class="btn-group">
                <a href='${create_issue_url(issue.number)}'
                  class="btn btn-sm btn-outline-secondary"
                >
                  more <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-right" viewBox="0 0 16 16">
                  <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>`
    );
  });

  // let's add the pagination links
  for (let i = 1; i <= pages; i++) {
    const class_ = page == i ? "active" : "";
    $(".pagination").append(
      `<li class='page-item ${class_}'> 
        <a class='page-link' href='${window.location.href.replace(
          /(?:\/[^\/\r\n]*)$/,
          ""
        )}?page=${i}''>${i}</a>
      </li>`
    );
  }
}

$(document).ready(function () {
  display_issues();

  if (label) {
    navBreadcrumb.classList.toggle("d-none");
    $(".label-name").html(label);
  }
});

document.addEventListener("DOMContentLoaded", function () {
  var lazyloadImages = document.querySelectorAll("img.lazy");
  var lazyloadThrottleTimeout;

  function lazyload() {
    if (lazyloadThrottleTimeout) {
      clearTimeout(lazyloadThrottleTimeout);
    }

    lazyloadThrottleTimeout = setTimeout(function () {
      var scrollTop = window.pageYOffset;
      lazyloadImages.forEach(function (img) {
        if (img.offsetTop < window.innerHeight + scrollTop) {
          img.src = img.dataset.src;
          img.classList.remove("lazy");
        }
      });
      if (lazyloadImages.length == 0) {
        document.removeEventListener("scroll", lazyload);
        window.removeEventListener("resize", lazyload);
        window.removeEventListener("orientationChange", lazyload);
      }
    }, 20);
  }

  document.addEventListener("scroll", lazyload);
  window.addEventListener("resize", lazyload);
  window.addEventListener("orientationChange", lazyload);
});
