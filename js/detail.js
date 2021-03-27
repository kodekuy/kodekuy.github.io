const project_id = (window.location.href).replace(/.+=/, '').replace('#','');
const URL = "https://api.github.com/repos/kodekuy/kodekuy.github.io/issues/" + project_id;

let xhr_issue_done = false;
let xhr_comments_done = false;

const projectData = 'projects:id:' + project_id;
const projectDataComments = 'projects:id:' + project_id + ':c';

console.log(projectDataComments)

let progressInt = 0;
var progress = setInterval(() => {
  if (progressInt < 100) {
    progressInt += 1;
  }
  $(".progress-bar").attr({ style: "width: " + progressInt + "%" });
}, 500);

function remove_progress () {
  if (xhr_issue_done && xhr_comments_done) {
    $('.progress').slideUp();
    $('#block-comment').removeClass('d-none');
  }
  clearInterval(progress);
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

function generate_body(data) {
  document.title = data.title;
  $('#issue-title').html(data.title);
  $('#labels').append(generate_label_html(data.labels));
  $('#issue-a').attr({href: data.html_url + '#issue-comment-box'});
  $('#issue-body').html(marked(data.body)
    .replace(/h[1-6]/g, 'h5')
    .replace('<img', "<img class='responsive-img shadow-sm mb-5'")
  );
}

function generate_comments(data) {
  const comments = data || [];
  if (comments.length === 0) {
    $('#comments').append('<i>No comments.</i>');
    return;
  }
  comments.forEach(function (comment) {
    $('#comments').append(
      `<div class='col s12'>
        <div class='card-panel'>
          <strong>${comment.user.login}</strong>
          <br>
          ${marked(comment.body).replace('<img', "<img class='responsive-img shadow-sm mb-5'")}
        </div>
      </div>`
    );
  });
}

$(document).ready(function () {
  let project = localStorage.getItem(projectData);
  if (project) {
    let data = JSON.parse(project);
    xhr_issue_done = true;
    xhr_comments_done = true;
    remove_progress();
    generate_body(data);
  }

  let comments = localStorage.getItem(projectDataComments);
  if (comments) {
    generate_comments(JSON.parse(comments));
    return;
  } else {

    $.get({
      url: URL + '/comments',
      success: function (data) {
        xhr_comments_done = true;
        remove_progress();
        if (data) {
          localStorage.setItem(projectDataComments, JSON.stringify(data));
        }
        generate_comments(data);
      }
    });

  }

  $.get({
    url: URL,
    success: function (data) {
      xhr_issue_done = true;
      remove_progress();
      localStorage.setItem(projectData, JSON.stringify(data));
      generate_body(data);
    }
  });
});