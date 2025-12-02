// let followersFileInput = document.getElementById("followersFile");
// let followingFileInput = document.getElementById("followingFile");
let zipFileInput = document.getElementById("zipFile");
//import JSZip from "jszip";

async function extractFollowersAndFollowing(zipFile) {
  try {
    //var zipData = new JSZip();
    // Загружаем ZIP архив
    console.log("Старт загрузки ZIP:", zipFile);
    const zipData = await JSZip.loadAsync(zipFile);

    // Проверяем существование файлов
    const followersPath =
      "connections/followers_and_following/followers_1.json";
    const followingPath = "connections/followers_and_following/following.json";

    if (!zipData.file(followersPath) || !zipData.file(followingPath)) {
      throw new Error("Один или оба файла не найдены в архиве");
    }
    console.log("Успешно загружен ZIP:", zipData);
    // Извлекаем и парсим файлы
    const followersContent = await zipData.file(followersPath).async("text");
    console.log("Успешно загружен followersContent:", followersContent);
    const followingContent = await zipData.file(followingPath).async("text");
    console.log("Успешно загружен followingContent:", followingContent);
    // Парсим JSON
    let followersData = JSON.parse(followersContent);
    let followingData = JSON.parse(followingContent);

    return {
      followers: followersData,
      following: followingData,
    };
  } catch (error) {
    console.error("Ошибка при обработке архива:", error);
    throw error;
  }
}

//let resultList = document.getElementById("resultList");
let tg = window.Telegram.WebApp;
tg.expand();
function addToList(followers) {
  console.log("Обьектов для добавления: " + followers.length);
  document.getElementById("resultList").innerHTML = "";
  followers.forEach((follower) => {
    console.log("ПОпытка добавления обьекта в DOM: " + follower);
    //const listItem = document.createElement("li");
    //listItem.className = "list-group-item";

    // Создание кликабельной ссылки
    const anchor = document.createElement("a");
    anchor.href = follower.string_list_data[0].href;
    anchor.className = "list-group-item list-group-item-action";
    var date = new Date(follower.string_list_data[0].timestamp * 1000);
    var printDate =
      date.getDate() +
      "." +
      (date.getMonth() + 1) +
      "." +
      date.getFullYear() +
      " " +
      date.getHours() +
      ":" +
      date.getMinutes() +
      ":" +
      date.getSeconds();
    anchor.textContent = follower.title + " Дата подписки: " + printDate; // используем текст из объекта или значение по умолчанию
    anchor.target = "_blank"; // открывать в новой вкладке (опционально)
    console.log(anchor);

    // Добавляем ссылку в элемент li
    //listItem.appendChild(anchor);

    // Добавляем элемент в DOM (например, в ul с классом list-group)
    //document.querySelector(".list-group").appendChild(anchor);
    //resultList.appendChild();

    // Использование:
    const cardHTML = createCustomCard(
      follower.title,
      printDate,
      "Открыть профиль",
      follower.string_list_data[0].href
    );
    console.log(cardHTML);
    document.getElementById("resultList").innerHTML += cardHTML;

    document.querySelectorAll(".btn").forEach((button) => {
      button.addEventListener("click", function () {
        this.classList.replace("btn-primary", "btn-light");
      });
    });
    // document.getElementById("resultList").appendChild(cardHTML);
  });
}

function createCustomCard(title, text, buttonText, buttonUrl = "#") {
  return `
        <div class="card" style="width: 18rem; margin: 12px">
            <div class="card-body">
                <h5 class="card-title">${title}</h5>
                <p class="card-text">${text}</p>
                <a href="${buttonUrl}" class="btn btn-primary" target="_blank">${buttonText}</a>
            </div>
        </div>
    `;
}

function rewiew() {
  try {
    console.log("ПОпытка сравнения файлов");

    if (window.following != null && window.followers != null) {
      let following = window.following.relationships_following;

      const hrefFolowers = window.followers.map(
        (item) => item.string_list_data[0].value
      );
      const flwrs = new Set(hrefFolowers);
      const diff = following.filter((item) => !flwrs.has(item.title));
      const result = diff.map((item) => item);
      console.log("Данные обработаны успешно:");
      console.log(result);
      addToList(result);
    } else {
      console.log("Один из файлов не указан либо ошибка при чтении");
    }
  } catch (error) {
    console.log(new Error(`Ошибка сравнения JSON: ${error.message}`));
  }
}

function handleFileUpload(event) {
  const file = event.target.files[0];

  if (!file) {
    alert("Файл не выбран");
    return;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const jsonData = JSON.parse(e.target.result);
        let resultArray;

        // Обрабатываем разные форматы JSON
        if (Array.isArray(jsonData)) {
          resultArray = jsonData;
        } else if (typeof jsonData === "object" && jsonData !== null) {
          // Если JSON - объект, создаем массив с этим объектом
          resultArray = [jsonData];
        } else {
          reject(new Error("Неподдерживаемый формат JSON"));
          return;
        }

        resolve(resultArray);
      } catch (error) {
        reject(new Error(`Ошибка парсинга JSON: ${error.message}`));
      }
    };

    reader.onerror = function () {
      reject(new Error("Ошибка чтения файла"));
    };

    reader.readAsText(file);
  });
}

// Основная функция для обработки загруженного файла
async function handleZipFileUpload(file) {
  //const fileInput = event.target;
  //const file = fileInput.files[0];

  if (!file) {
    alert("Пожалуйста, выберите файл");
    return;
  }

  if (!file.name.endsWith(".zip")) {
    alert("Пожалуйста, выберите ZIP файл");
    return;
  }

  try {
    // Показываем индикатор загрузки
    console.log("Обработка файла...");

    // Преобразуем файл в ArrayBuffer для JSZip
    const arrayBuffer = await readFileAsArrayBuffer(file);

    // Извлекаем данные
    const result = await extractFollowersAndFollowing(arrayBuffer);

    console.log("Успешно обработано!");
    console.log("Подписчики:", result.followers);
    console.log("Подписки:", result.following);
    window.followers = result.followers;
    window.following = result.following;
    rewiew();
    //console.log("Статистика:", result.stats);

    // Выводим результат на страницу
    //displayResults(result);
  } catch (error) {
    console.error("Ошибка обработки файла:", error);
    alert("Ошибка при обработке файла: " + error.message);
  }
}

// Вспомогательная функция для чтения файла как ArrayBuffer
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      resolve(e.target.result);
    };
    reader.onerror = function (e) {
      reject(new Error("Ошибка чтения файла"));
    };
    reader.readAsArrayBuffer(file);
  });
}

// // Использование с async/await
// followersFileInput.addEventListener("change", async function (event) {
//   try {
//     const jsonArray = await handleFileUpload(event);
//     console.log("Успешно загружено followers:", jsonArray);

//     // Сохраняем данные
//     window.followers = jsonArray;
//     rewiew();
//   } catch (error) {
//     console.error("Ошибка загрузки:", error.message);
//     alert(`Ошибка: ${error.message}`);
//   }
// });

// followingFileInput.addEventListener("change", async function (event) {
//   try {
//     const jsonArray = await handleFileUpload(event);
//     console.log("Успешно загружено following:", jsonArray);

//     // Сохраняем данные
//     window.following = jsonArray;
//     rewiew();
//   } catch (error) {
//     console.error("Ошибка загрузки:", error.message);
//     alert(`Ошибка: ${error.message}`);
//   }
// });

// zipFileInput.addEventListener("change", async function (event) {
//   try {
//     console.log("Файл выбран");
//     zipFile = await handleZipFileUpload(event);
//     //unzipData = extractFollowersAndFollowing(zipFile);
//     //console.log("Успешно загружено followers:", unzipData);

//     // Сохраняем данные
//     //window.followers = unzipData.followers;
//     //window.following = unzipData.following;
//   } catch (error) {
//     console.error("Ошибка загрузки:", error.message);
//     alert(`Ошибка: ${error.message}`);
//   }
// });

Dropzone.autoDiscover = false;

const myDropzone = new Dropzone("#myDropzone", {
  url: "/upload", // URL для загрузки
  paramName: "file", // Имя параметра
  maxFilesize: 15, // MB
  maxFiles: 1, // Максимальное количество файлов
  acceptedFiles: ".zip", // Разрешенные типы
  addRemoveLinks: true, // Показывать ссылку для удаления
  dictDefaultMessage: "Перетащите файлы сюда",
  dictFallbackMessage:
    "Ваш браузер не поддерживает загрузку файлов через drag&drop",
  dictFileTooBig:
    "Файл слишком большой ({{filesize}}MB). Максимум: {{maxFilesize}}MB",
  dictInvalidFileType: "Этот тип файла не поддерживается",
  dictResponseError: "Ошибка сервера",
  dictCancelUpload: "Отменить загрузку",
  dictUploadCanceled: "Загрузка отменена",
  dictRemoveFile: "Удалить файл",
  dictMaxFilesExceeded: "Максимальное количество файлов превышено",
  autoProcessQueue: false, // Не загружать автоматически
  parallelUploads: 3, // Количество одновременных загрузок
  uploadMultiple: true, // Загрузка нескольких файлов
  init: function () {
    // События Dropzone
    this.on("success", function (file, response) {
      console.log("Файл загружен:", file.name);
    });

    this.on("error", function (file, errorMessage) {
      alert("Ошибка при загрузке: " + errorMessage);
    });
    this.on("addedfile", async function (file) {
      //showLoading(true);
      //showStatus("Производим анализ подписчиков", "info");
      try {
        await handleZipFileUpload(file);
        // showStatus("Подписчики проанализированы", "success");
      } catch (error) {
        //showStatus("В процессе анализа возникла ошибка:{error.message}", "er");
      } finally {
        // showLoading(false);
      }
      //showStatus("Подписчики проанализированы", "success");
      console.log("A file has been added:", file.name, file);
    });
    this.on("complete", function (file) {
      if (
        this.getUploadingFiles().length === 0 &&
        this.getQueuedFiles().length === 0
      ) {
        alert("Все файлы загружены!");
      }
    });
  },
});
function showLoading(show) {
  const loadingEl = document.getElementById("loading");
  loadingEl.style.display = show ? "block" : "none";
}

function showStatus(message, type = "info") {
  const statusEl = document.getElementById("status");
  statusEl.textContent = message;
  statusEl.className = "";
}
function getFileIcon(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  const icons = {
    txt: "📄",
    pdf: "📕",
    doc: "📘",
    docx: "📘",
    xls: "📗",
    xlsx: "📗",
    csv: "📊",
    jpg: "🖼️",
    jpeg: "🖼️",
    png: "🖼️",
    gif: "🖼️",
    svg: "🖼️",
    html: "🌐",
    htm: "🌐",
    css: "🎨",
    js: "💻",
    zip: "📦",
    rar: "📦",
    "7z": "📦",
    mp3: "🎵",
    wav: "🎵",
    mp4: "🎬",
    avi: "🎬",
  };
  return icons[ext] || "📄";
}
