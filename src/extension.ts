import * as vscode from 'vscode';

function formatText(texto:string, separador:string ) {

	let lineas = texto.split(/\r?\n/);

	let tabla = lineas.map(linea => linea.split(separador));
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
	texto_final = texto_final.trim();
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

		for (const linea of lineas) {
			let cantidadColumnas = linea.split(separador).length;
            console.log(linea.split(separador));

			if (lengthColumnasAnterior===0) {
				lengthColumnasAnterior=cantidadColumnas;
			} else{
				lengthColumnasAnterior=lengthColumnasActual;
			}

			lengthColumnasActual = cantidadColumnas;

            console.log("actual: "+ lengthColumnasActual);
            console.log("anterior: " + lengthColumnasAnterior);

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

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('csvformatter.csvformatter', () => {

		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const selection = editor.selection;
		
		const lineStartPosition = new vscode.Position(selection.start.line, 0);

		const endLine = editor.document.lineAt(selection.end.line); // obtener texto de ultima linea seleccionada
		const endLineLength = endLine.text.length;
		const lineEndPosition = new vscode.Position(selection.end.line, endLineLength);
		
		const selectionRange = new vscode.Range(lineStartPosition, lineEndPosition);
		
 		let text = editor.document.getText(selectionRange); // Obtiene el texto completo de las líneas de la selección


		text = text.trim();

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
