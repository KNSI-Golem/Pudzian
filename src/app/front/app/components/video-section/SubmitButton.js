'use client';

async function onSubmit(url) {
  // TODO
  // url to video
  console.log(url)
}

const SubmitButton = (({ url }) => {
    return (
        <div className="flex flex-col items-center mt-10">
          <button
            onClick={ () => onSubmit(url) }
            className="w-50 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-6 rounded button"
          >
            Submit
          </button>
        </div>
      );
});

export default SubmitButton;