import * as vscode from 'vscode';

function formatText(texto:string, separador:string ) {

	let lineas = texto.split(/\r?\n/);
	let tabla;

	if (separador === ',') { // si es con coma, comprobar que no esté entre quotes
		let regex = new RegExp(separador + "(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)")
		tabla = lineas.map(linea => linea.split(regex));
	}else{
		tabla = lineas.map(linea => linea.split(separador));
	}
	
	let cantidad_columnas = tabla[0].length;
	let columnas: string[][] = [];
	for (let i = 0; i < cantidad_columnas; i++) {
		let columna = tabla.map(fila => fila[i]);
		columnas.push(columna);
	}

	let max_largo_por_columna = columnas.map(columna => columna.reduce((max_largo, valor) => Math.max(max_largo, valor.length), 0));


	let texto_final = "";

	for (let linea of tabla) {
		let output_linea = "";

		for (let num_columna = 0; num_columna < linea.length; num_columna++) {
			if (num_columna != linea.length-1) {
				output_linea += `${linea[num_columna].padEnd(max_largo_por_columna[num_columna])} ${separador} `;
				
			}else{
				output_linea += `${linea[num_columna].padEnd(max_largo_por_columna[num_columna])}`;
			}
		}


		texto_final += output_linea + "\n";

	}
	
	return texto_final;
}

function getSeparador(texto:string) {
	let posiblesSeparadores = ["|",";",",","\t"];
	let lineas = texto.split(/\r?\n/);

	let separadorDetectado ="";
	
	for (const separador of posiblesSeparadores) {
        let lengthColumnasActual=0;
		let lengthColumnasAnterior=0;
        let columnasCoinciden=true;
		
		let cantidadColumnas;
		for (const linea of lineas) {

			if (separador === ',') {
				cantidadColumnas = linea.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).length; // si es con coma, comprobar que no esté entre quotes
				
			}else{
				cantidadColumnas = linea.split(separador).length;
			}


			if (lengthColumnasAnterior===0) {
				lengthColumnasAnterior=cantidadColumnas;
			} else{
				lengthColumnasAnterior=lengthColumnasActual;
			}

			lengthColumnasActual = cantidadColumnas;


            if (lengthColumnasActual != lengthColumnasAnterior || lengthColumnasActual == 1) {
                columnasCoinciden = false;
                break;
            }

		}

        if (columnasCoinciden) {
            separadorDetectado=separador;
            break;
        }

	}

    return separadorDetectado;
}

function eliminarLineasVacias(texto:string) {
    var lineas = texto.split('\n');
    var lineasNoVacias = lineas.filter(function(linea) {
        // Usa una expresión regular para verificar si la línea contiene solo espacios.
        return /\S/.test(linea);
    });
    return lineasNoVacias.join('\n');
}

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('csvformatter.csvformatter', () => {

		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const selection = editor.selection;

		if (selection.end.line - selection.start.line >= 500) {
			vscode.window.showInformationMessage('Selección muy grande');
			return;
		}
		
		const lineStartPosition = new vscode.Position(selection.start.line, 0);

		const endLine = editor.document.lineAt(selection.end.line); // obtener texto de ultima linea seleccionada
		const endLineLength = endLine.text.length;
		const lineEndPosition = new vscode.Position(selection.end.line, endLineLength);
		
		const selectionRange = new vscode.Range(lineStartPosition, lineEndPosition);
		
 		let text = editor.document.getText(selectionRange); // Obtiene el texto completo de las líneas de la selección


		text = eliminarLineasVacias(text);

		const separador: string = getSeparador(text);
		
		if (separador == '') {
			
			vscode.window.showInformationMessage('No se detectó separador');
			return;
		}
		
		vscode.window.showInformationMessage('Separador detectado: ' + (separador === "\t" ? "Tab (\\t)":separador));
				
		let texto_final = formatText(text,separador);
		
		editor.edit(editBuilder => {
			
			editBuilder.delete(selectionRange);
			editBuilder.insert(lineStartPosition, texto_final);
			
		});
		

	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
