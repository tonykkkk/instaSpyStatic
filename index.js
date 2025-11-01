let followersFileInput = document.getElementById("followersFile");
let followingFileInput = document.getElementById("followingFile");
//let resultList = document.getElementById("resultList");

function addToList(links) {
  console.log("Обьектов для добавления: " + links.length);
  links.forEach((link) => {
    console.log("ПОпытка добавления обьекта в DOM: " + link);
    //const listItem = document.createElement("li");
    //listItem.className = "list-group-item";

    // Создание кликабельной ссылки
    const anchor = document.createElement("a");
    anchor.href = link;
    anchor.className = "list-group-item list-group-item-action";
    anchor.textContent = JSON.stringify(link); // используем текст из объекта или значение по умолчанию
    anchor.target = "_blank"; // открывать в новой вкладке (опционально)
    console.log(anchor);

    // Добавляем ссылку в элемент li
    //listItem.appendChild(anchor);

    // Добавляем элемент в DOM (например, в ul с классом list-group)
    document.querySelector(".list-group").appendChild(anchor);
    //resultList.appendChild();
  });
}

function rewiew() {
  try {
    console.log("ПОпытка сравнения файлов");

    if (window.following != null && window.followers != null) {
      let following = window.following[0].relationships_following;

      const hrefFolowers = window.followers.map(
        (item) => item.string_list_data[0].value
      );
      const flwrs = new Set(hrefFolowers);
      const diff = following.filter((item) => !flwrs.has(item.title));
      const result = diff.map((item) => item.string_list_data[0].href);
      console.log("Данные обработаны успешно:");
      console.log(result);
      addToList(result);
    } else {
      console.log("Один из файлов не указан либо ошибка при чтении");
    }
  } catch (error) {
    reject(new Error(`Ошибка сравнения JSON: ${error.message}`));
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

// Использование с async/await
followersFileInput.addEventListener("change", async function (event) {
  try {
    const jsonArray = await handleFileUpload(event);
    console.log("Успешно загружено followers:", jsonArray);

    // Сохраняем данные
    window.followers = jsonArray;
    rewiew();
  } catch (error) {
    console.error("Ошибка загрузки:", error.message);
    alert(`Ошибка: ${error.message}`);
  }
});

followingFileInput.addEventListener("change", async function (event) {
  try {
    const jsonArray = await handleFileUpload(event);
    console.log("Успешно загружено following:", jsonArray);

    // Сохраняем данные
    window.following = jsonArray;
    rewiew();
  } catch (error) {
    console.error("Ошибка загрузки:", error.message);
    alert(`Ошибка: ${error.message}`);
  }
});
